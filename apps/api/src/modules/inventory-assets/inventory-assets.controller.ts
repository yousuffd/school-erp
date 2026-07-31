import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { StockService } from './stock.service';
import { AssetTagsService } from './asset-tags.service';
import { ProcurementRequestsService } from './procurement-requests.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RecordStockTransactionDto } from './dto/record-stock-transaction.dto';
import { CreateAssetTagDto } from './dto/create-asset-tag.dto';
import { UpdateAssetTagDto } from './dto/update-asset-tag.dto';
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto';
import { UpdateProcurementRequestStatusDto } from './dto/update-procurement-request-status.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Single consolidated controller for Inventory & Assets (Blueprint Part 2,
 * Module 15), same pattern as Transportation/Health & Wellness — per
 * default choice at this point in the project (three prior modules have
 * all gone consolidated; no reason left to ask each time).
 *
 * Every resource area has its own top-level path segment (items/, stock/,
 * asset-tags/, procurement-requests/), so no route-ordering collision risk
 * between areas — same reasoning as Transportation's controller.
 */
@ApiTags('inventory-assets')
@ApiBearerAuth()
@Controller('inventory-assets')
export class InventoryAssetsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly stockService: StockService,
    private readonly assetTagsService: AssetTagsService,
    private readonly procurementRequestsService: ProcurementRequestsService,
  ) {}

  // ---------- Items ----------

  @Post('items')
  @Permissions({ module: 'inventory-assets', action: 'create' })
  createItem(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  @Get('items')
  @Permissions({ module: 'inventory-assets', action: 'view' })
  findItems(@Query('tenantId') tenantId: string, @Query('category') category?: string) {
    return this.itemsService.findAllForTenant(tenantId, category);
  }

  @Get('items/:id')
  @Permissions({ module: 'inventory-assets', action: 'view' })
  findItem(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch('items/:id')
  @Permissions({ module: 'inventory-assets', action: 'edit' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Delete('items/:id')
  @Permissions({ module: 'inventory-assets', action: 'delete' })
  removeItem(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }

  // ---------- Stock (bulk/consumable items) ----------

  @Post('stock/transactions')
  @Permissions({ module: 'inventory-assets', action: 'create' })
  recordStockTransaction(@Body() dto: RecordStockTransactionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stockService.recordTransaction(dto, user.userId);
  }

  @Get('stock')
  @Permissions({ module: 'inventory-assets', action: 'view' })
  findStock(@Query('tenantId') tenantId: string, @Query('campusId') campusId: string) {
    return this.stockService.findStockForTenant(tenantId, campusId);
  }

  @Get('stock/transactions/by-item/:itemId')
  @Permissions({ module: 'inventory-assets', action: 'view' })
  findTransactionsForItem(@Param('itemId') itemId: string, @Query('campusId') campusId?: string) {
    return this.stockService.findTransactionsForItem(itemId, campusId);
  }

  // ---------- Asset Tags (individually tracked items) ----------

  @Post('asset-tags')
  @Permissions({ module: 'inventory-assets', action: 'create' })
  createAssetTag(@Body() dto: CreateAssetTagDto) {
    return this.assetTagsService.create(dto);
  }

  @Get('asset-tags')
  @Permissions({ module: 'inventory-assets', action: 'view' })
  findAssetTags(
    @Query('tenantId') tenantId: string,
    @Query('itemId') itemId?: string,
    @Query('status') status?: string,
  ) {
    return this.assetTagsService.findAllForTenant(tenantId, itemId, status);
  }

  @Patch('asset-tags/:id')
  @Permissions({ module: 'inventory-assets', action: 'edit' })
  updateAssetTag(@Param('id') id: string, @Body() dto: UpdateAssetTagDto) {
    return this.assetTagsService.update(id, dto);
  }

  // ---------- Procurement Requests ----------

  @Post('procurement-requests')
  @Permissions({ module: 'inventory-assets', action: 'create' })
  createProcurementRequest(@Body() dto: CreateProcurementRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.procurementRequestsService.create(dto, user.userId);
  }

  @Get('procurement-requests')
  @Permissions({ module: 'inventory-assets', action: 'view' })
  findProcurementRequests(@Query('tenantId') tenantId: string, @Query('status') status?: string) {
    return this.procurementRequestsService.findAllForTenant(tenantId, status);
  }

  @Patch('procurement-requests/:id/status')
  @Permissions({ module: 'inventory-assets', action: 'approve' })
  updateProcurementRequestStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProcurementRequestStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.procurementRequestsService.updateStatus(id, dto, user.userId);
  }
}
