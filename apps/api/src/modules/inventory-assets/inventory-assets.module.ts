import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemStock } from './entities/item-stock.entity';
import { StockTransaction } from './entities/stock-transaction.entity';
import { AssetTag } from './entities/asset-tag.entity';
import { ProcurementRequest } from './entities/procurement-request.entity';
import { ItemsService } from './items.service';
import { StockService } from './stock.service';
import { AssetTagsService } from './asset-tags.service';
import { ProcurementRequestsService } from './procurement-requests.service';
import { InventoryAssetsController } from './inventory-assets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemStock, StockTransaction, AssetTag, ProcurementRequest])],
  controllers: [InventoryAssetsController],
  providers: [ItemsService, StockService, AssetTagsService, ProcurementRequestsService],
  exports: [ItemsService, StockService, AssetTagsService, ProcurementRequestsService],
})
export class InventoryAssetsModule {}
