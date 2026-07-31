import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScreeningCampaign } from './entities/screening-campaign.entity';
import { CreateScreeningCampaignDto } from './dto/create-screening-campaign.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class ScreeningCampaignsService {
  constructor(
    @InjectRepository(ScreeningCampaign) private readonly campaignRepo: Repository<ScreeningCampaign>,
  ) {}

  private repo(): Repository<ScreeningCampaign> {
    return scopedRepo(this.campaignRepo, ScreeningCampaign);
  }

  // No Teacher-scoping needed here — a campaign definition ("Vision Screening
  // Nov 2025") has no student link at all, unlike its per-student results.
  // Teacher's 'view' permission sees the full campaign list tenant-wide;
  // only ScreeningResultsService actually scopes by student.
  create(dto: CreateScreeningCampaignDto): Promise<ScreeningCampaign> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<ScreeningCampaign[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { campaign_date: 'DESC' } });
  }

  async findOne(id: string): Promise<ScreeningCampaign> {
    const campaign = await this.repo().findOne({ where: { id } });
    if (!campaign) throw new NotFoundException(`Screening campaign ${id} not found`);
    return campaign;
  }
}
