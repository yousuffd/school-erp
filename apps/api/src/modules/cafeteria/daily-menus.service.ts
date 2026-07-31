import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyMenu } from './entities/daily-menu.entity';
import { DailyMenuItem } from './entities/daily-menu-item.entity';
import { MenuItem } from './entities/menu-item.entity';
import { CreateDailyMenuDto } from './dto/create-daily-menu.dto';
import { AddMenuItemToDailyMenuDto } from './dto/add-menu-item-to-daily-menu.dto';
import { scopedRepo } from '../../common/context/tenant-context';

export interface DailyMenuWithItems extends DailyMenu {
  items: MenuItem[];
}

@Injectable()
export class DailyMenusService {
  constructor(
    @InjectRepository(DailyMenu) private readonly dailyMenuRepo: Repository<DailyMenu>,
    @InjectRepository(DailyMenuItem) private readonly dailyMenuItemRepo: Repository<DailyMenuItem>,
    @InjectRepository(MenuItem) private readonly menuItemRepo: Repository<MenuItem>,
  ) {}

  private repo(): Repository<DailyMenu> {
    return scopedRepo(this.dailyMenuRepo, DailyMenu);
  }
  private itemsJoinRepo(): Repository<DailyMenuItem> {
    return scopedRepo(this.dailyMenuItemRepo, DailyMenuItem);
  }
  private menuItemsRepo(): Repository<MenuItem> {
    return scopedRepo(this.menuItemRepo, MenuItem);
  }

  /**
   * Pre-checks for an existing (tenant_id, menu_date, meal_type) row
   * before inserting — the DB has a real unique constraint on that triple,
   * and without this check a duplicate create attempt hit a raw,
   * unhandled Postgres constraint-violation error, surfacing as a generic
   * 500 instead of a clean message (same class of bug fixed in
   * Inventory & Assets' item-delete guard, and the same pattern
   * Transportation's RouteAssignmentsService.create() already followed
   * correctly for its own unique constraint).
   */
  async create(dto: CreateDailyMenuDto): Promise<DailyMenu> {
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, menu_date: dto.menu_date, meal_type: dto.meal_type },
    });
    if (existing) {
      throw new ConflictException(
        `A ${dto.meal_type} menu already exists for ${dto.menu_date}. Edit that menu's items instead of creating a new one.`,
      );
    }
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, dateFrom?: string, dateTo?: string): Promise<DailyMenu[]> {
    const qb = this.repo().createQueryBuilder('m').where('m.tenant_id = :tenantId', { tenantId });
    if (dateFrom) qb.andWhere('m.menu_date >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('m.menu_date <= :dateTo', { dateTo });
    return qb.orderBy('m.menu_date', 'ASC').getMany();
  }

  async findOne(id: string): Promise<DailyMenuWithItems> {
    const menu = await this.repo().findOne({ where: { id } });
    if (!menu) throw new NotFoundException(`Daily menu ${id} not found`);
    const joins = await this.itemsJoinRepo().find({ where: { daily_menu_id: id } });
    const items = joins.length
      ? await this.menuItemsRepo().find({ where: joins.map((j) => ({ id: j.menu_item_id })) })
      : [];
    return { ...menu, items };
  }

  async remove(id: string): Promise<void> {
    // DailyMenuItem rows cascade-delete at the DB level, so no explicit cleanup needed here.
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Daily menu ${id} not found`);
  }

  async addMenuItem(dailyMenuId: string, dto: AddMenuItemToDailyMenuDto): Promise<DailyMenuItem> {
    const menu = await this.repo().findOne({ where: { id: dailyMenuId } });
    if (!menu) throw new NotFoundException(`Daily menu ${dailyMenuId} not found`);
    const item = await this.menuItemsRepo().findOne({ where: { id: dto.menu_item_id } });
    if (!item) throw new NotFoundException(`Menu item ${dto.menu_item_id} not found`);

    const exists = await this.itemsJoinRepo().findOne({
      where: { tenant_id: dto.tenant_id, daily_menu_id: dailyMenuId, menu_item_id: dto.menu_item_id },
    });
    if (exists) {
      throw new BadRequestException(`"${item.name}" is already on this menu.`);
    }

    return this.itemsJoinRepo().save(
      this.itemsJoinRepo().create({ tenant_id: dto.tenant_id, daily_menu_id: dailyMenuId, menu_item_id: dto.menu_item_id }),
    );
  }

  async removeMenuItem(joinId: string): Promise<void> {
    const result = await this.itemsJoinRepo().delete(joinId);
    if (result.affected === 0) throw new NotFoundException(`Menu entry ${joinId} not found`);
  }
}
