import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemStock } from './entities/item-stock.entity';
import { AssetTag } from './entities/asset-tag.entity';
import { StockTransaction } from './entities/stock-transaction.entity';
import { ProcurementRequest } from './entities/procurement-request.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
    @InjectRepository(ItemStock) private readonly stockRepo: Repository<ItemStock>,
    @InjectRepository(AssetTag) private readonly assetTagRepo: Repository<AssetTag>,
    @InjectRepository(StockTransaction) private readonly transactionRepo: Repository<StockTransaction>,
    @InjectRepository(ProcurementRequest) private readonly procurementRepo: Repository<ProcurementRequest>,
  ) {}

  private repo(): Repository<Item> {
    return scopedRepo(this.itemRepo, Item);
  }

  create(dto: CreateItemDto): Promise<Item> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, category?: string): Promise<Item[]> {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (category) where.category = category;
    return this.repo().find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.repo().findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.repo().findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    Object.assign(item, dto);
    return this.repo().save(item);
  }

  /**
   * Guarded delete. Checks all four tables that reference item_id, not
   * just ItemStock/AssetTag — StockTransaction and ProcurementRequest
   * both have ON DELETE RESTRICT at the database level (deliberately:
   * they're audit/historical records that shouldn't silently disappear),
   * and an earlier version of this method only checked ItemStock/AssetTag
   * (which are CASCADE, so the DB would have allowed deleting those
   * silently). Missing the RESTRICT-backed checks meant a delete
   * attempt against an item with existing transactions or procurement
   * history hit a raw, unhandled Postgres FK-violation error — surfacing
   * to the user as a generic "Internal server error" instead of a clear
   * message. This now checks all four before attempting the delete.
   */
  async remove(id: string): Promise<void> {
    const [stockCount, tagCount, transactionCount, procurementCount] = await Promise.all([
      scopedRepo(this.stockRepo, ItemStock).count({ where: { item_id: id } }),
      scopedRepo(this.assetTagRepo, AssetTag).count({ where: { item_id: id } }),
      scopedRepo(this.transactionRepo, StockTransaction).count({ where: { item_id: id } }),
      scopedRepo(this.procurementRepo, ProcurementRequest).count({ where: { item_id: id } }),
    ]);
    if (stockCount > 0 || tagCount > 0 || transactionCount > 0 || procurementCount > 0) {
      const parts: string[] = [];
      if (stockCount > 0) parts.push(`${stockCount} stock record(s)`);
      if (tagCount > 0) parts.push(`${tagCount} asset tag(s)`);
      if (transactionCount > 0) parts.push(`${transactionCount} stock transaction(s)`);
      if (procurementCount > 0) parts.push(`${procurementCount} procurement request(s)`);
      throw new BadRequestException(
        `Cannot delete an item with existing ${parts.join(', ')}. This item's history must remain intact.`,
      );
    }
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Item ${id} not found`);
  }
}
