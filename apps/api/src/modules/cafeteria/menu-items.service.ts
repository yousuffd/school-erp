import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { DailyMenuItem } from './entities/daily-menu-item.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectRepository(MenuItem) private readonly menuItemRepo: Repository<MenuItem>,
    @InjectRepository(DailyMenuItem) private readonly dailyMenuItemRepo: Repository<DailyMenuItem>,
  ) {}

  private repo(): Repository<MenuItem> {
    return scopedRepo(this.menuItemRepo, MenuItem);
  }

  create(dto: CreateMenuItemDto): Promise<MenuItem> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<MenuItem[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.repo().findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.repo().findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item ${id} not found`);
    Object.assign(item, dto);
    return this.repo().save(item);
  }

  /** Guarded — refuses if this dish is still listed on any daily menu (past or future). */
  async remove(id: string): Promise<void> {
    const usageCount = await scopedRepo(this.dailyMenuItemRepo, DailyMenuItem).count({ where: { menu_item_id: id } });
    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete a dish that's listed on ${usageCount} daily menu(s). Remove it from those menus first.`,
      );
    }
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Menu item ${id} not found`);
  }
}
