import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemStock } from './entities/item-stock.entity';
import { StockTransaction, StockTransactionType } from './entities/stock-transaction.entity';
import { RecordStockTransactionDto } from './dto/record-stock-transaction.dto';
import { scopedRepo } from '../../common/context/tenant-context';

export interface StockLevel extends ItemStock {
  item_name: string;
  reorder_point: number | null;
  below_reorder_point: boolean;
}

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
    @InjectRepository(ItemStock) private readonly stockRepo: Repository<ItemStock>,
    @InjectRepository(StockTransaction) private readonly transactionRepo: Repository<StockTransaction>,
  ) {}

  private itemsRepo(): Repository<Item> {
    return scopedRepo(this.itemRepo, Item);
  }
  private stocksRepo(): Repository<ItemStock> {
    return scopedRepo(this.stockRepo, ItemStock);
  }
  private transactionsRepo(): Repository<StockTransaction> {
    return scopedRepo(this.transactionRepo, StockTransaction);
  }

  /**
   * Records a movement and updates the derived ItemStock row in the same
   * call — ItemStock.quantity_on_hand is never edited directly by a
   * caller, only ever recomputed here from a StockTransaction (same
   * "derived, not directly editable" relationship as BookCopy.status
   * being driven by BookIssue in the Library module).
   */
  async recordTransaction(dto: RecordStockTransactionDto, recordedBy: string): Promise<StockTransaction> {
    const item = await this.itemsRepo().findOne({ where: { id: dto.item_id } });
    if (!item) throw new NotFoundException(`Item ${dto.item_id} not found`);
    if (item.is_trackable_asset) {
      throw new BadRequestException(
        `"${item.name}" is tracked as individual asset tags, not bulk stock — use the asset tag endpoints instead.`,
      );
    }

    let stock = await this.stocksRepo().findOne({
      where: { tenant_id: dto.tenant_id, item_id: dto.item_id, campus_id: dto.campus_id },
    });
    if (!stock) {
      stock = this.stocksRepo().create({
        tenant_id: dto.tenant_id,
        item_id: dto.item_id,
        campus_id: dto.campus_id,
        quantity_on_hand: 0,
      });
    }

    if (dto.transaction_type === StockTransactionType.RECEIVED) {
      stock.quantity_on_hand += dto.quantity;
    } else if (dto.transaction_type === StockTransactionType.ISSUED) {
      if (dto.quantity > stock.quantity_on_hand) {
        throw new BadRequestException(
          `Cannot issue ${dto.quantity} — only ${stock.quantity_on_hand} currently on hand.`,
        );
      }
      stock.quantity_on_hand -= dto.quantity;
    } else {
      // ADJUSTED — quantity is the new absolute count, not a delta.
      stock.quantity_on_hand = dto.quantity;
    }
    await this.stocksRepo().save(stock);

    return this.transactionsRepo().save(
      this.transactionsRepo().create({ ...dto, recorded_by: recordedBy }),
    );
  }

  /**
   * Stock levels for every bulk (non-trackable) item at one campus,
   * defaulting to 0 on-hand for items that have never had a transaction
   * recorded — deliberately built FROM Item, not FROM ItemStock. An
   * earlier version queried ItemStock directly, which meant a freshly
   * created item was invisible on this screen until its first
   * transaction — confusing (an admin adds an item, expects to see it
   * here at 0, and instead sees nothing at all). campusId is required
   * for this reason: "stock across all campuses" isn't a single number
   * per item, so the view is inherently per-campus, same as
   * VehiclesSection's campus scoping in Transportation.
   */
  async findStockForTenant(tenantId: string, campusId: string): Promise<StockLevel[]> {
    const items = await this.itemsRepo().find({
      where: { tenant_id: tenantId, is_trackable_asset: false },
      order: { name: 'ASC' },
    });
    const stocks = await this.stocksRepo().find({ where: { tenant_id: tenantId, campus_id: campusId } });
    const stockByItem = new Map(stocks.map((s) => [s.item_id, s]));

    return items.map((item) => {
      const stock = stockByItem.get(item.id);
      const quantityOnHand = stock?.quantity_on_hand ?? 0;
      return {
        id: stock?.id ?? `virtual-${item.id}`,
        tenant_id: tenantId,
        item_id: item.id,
        campus_id: campusId,
        quantity_on_hand: quantityOnHand,
        created_at: stock?.created_at ?? item.created_at,
        updated_at: stock?.updated_at ?? item.updated_at,
        item_name: item.name,
        reorder_point: item.reorder_point ?? null,
        below_reorder_point: item.reorder_point != null && quantityOnHand <= item.reorder_point,
      } as StockLevel;
    });
  }

  findTransactionsForItem(itemId: string, campusId?: string): Promise<StockTransaction[]> {
    const where: Record<string, string> = { item_id: itemId };
    if (campusId) where.campus_id = campusId;
    return this.transactionsRepo().find({ where, order: { transaction_date: 'DESC' } });
  }
}
