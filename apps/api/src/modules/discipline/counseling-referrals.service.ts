import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselingReferral } from './entities/counseling-referral.entity';
import { CreateCounselingReferralDto } from './dto/create-counseling-referral.dto';
import { UpdateCounselingReferralDto } from './dto/update-counseling-referral.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class CounselingReferralsService {
  constructor(
    @InjectRepository(CounselingReferral) private readonly referralRepo: Repository<CounselingReferral>,
  ) {}

  private repo(): Repository<CounselingReferral> {
    return scopedRepo(this.referralRepo, CounselingReferral);
  }

  create(incidentId: string, dto: CreateCounselingReferralDto): Promise<CounselingReferral> {
    return this.repo().save(this.repo().create({ ...dto, incident_id: incidentId }));
  }

  findForIncident(incidentId: string): Promise<CounselingReferral[]> {
    return this.repo().find({ where: { incident_id: incidentId } });
  }

  findForCounselor(referredTo: string): Promise<CounselingReferral[]> {
    return this.repo().find({ where: { referred_to: referredTo }, order: { created_at: 'DESC' } });
  }

  async update(id: string, dto: UpdateCounselingReferralDto): Promise<CounselingReferral> {
    const referral = await this.repo().findOne({ where: { id } });
    if (!referral) throw new NotFoundException(`Counseling referral ${id} not found`);
    Object.assign(referral, dto);
    return this.repo().save(referral);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Counseling referral ${id} not found`);
  }
}
