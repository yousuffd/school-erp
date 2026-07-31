import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { AssetTag } from './entities/asset-tag.entity';
import { CreateAssetTagDto } from './dto/create-asset-tag.dto';
import { UpdateAssetTagDto } from './dto/update-asset-tag.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class AssetTagsService {
  constructor(
    @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
    @InjectRepository(AssetTag) private readonly assetTagRepo: Repository<AssetTag>,
  ) {}

  private itemsRepo(): Repository<Item> {
    return scopedRepo(this.itemRepo, Item);
  }
  private repo(): Repository<AssetTag> {
    return scopedRepo(this.assetTagRepo, AssetTag);
  }

  async create(dto: CreateAssetTagDto): Promise<AssetTag> {
    const item = await this.itemsRepo().findOne({ where: { id: dto.item_id } });
    if (!item) throw new NotFoundException(`Item ${dto.item_id} not found`);
    if (!item.is_trackable_asset) {
      throw new BadRequestException(
        `"${item.name}" is tracked as bulk stock, not individual asset tags — use the stock endpoints instead.`,
      );
    }
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, itemId?: string, status?: string): Promise<AssetTag[]> {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (itemId) where.item_id = itemId;
    if (status) where.status = status;
    return this.repo().find({ where, order: { asset_tag_number: 'ASC' } });
  }

  async update(id: string, dto: UpdateAssetTagDto): Promise<AssetTag> {
    const tag = await this.repo().findOne({ where: { id } });
    if (!tag) throw new NotFoundException(`Asset tag ${id} not found`);
    Object.assign(tag, dto);
    return this.repo().save(tag);
  }
}
