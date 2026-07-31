import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class DonationsService {
  constructor(@InjectRepository(Donation) private readonly repo_: Repository<Donation>) {}

  private repo(): Repository<Donation> {
    return scopedRepo(this.repo_, Donation);
  }

  create(dto: CreateDonationDto, recordedBy: string): Promise<Donation> {
    return this.repo().save(this.repo().create({ ...dto, recorded_by: recordedBy }));
  }

  findAllForTenant(tenantId: string, alumniId?: string): Promise<Donation[]> {
    const where: any = { tenant_id: tenantId };
    if (alumniId) where.alumni_id = alumniId;
    return this.repo().find({ where, order: { donation_date: 'DESC' } });
  }

  /** Total given by this alumnus — computed live, matching FeeBalance/discipline-points-balance convention. */
  async getTotalForAlumnus(alumniId: string): Promise<{ alumniId: string; totalDonated: number; donationCount: number }> {
    const result = await this.repo()
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.amount), 0)', 'total')
      .addSelect('COUNT(d.id)', 'count')
      .where('d.alumni_id = :alumniId', { alumniId })
      .getRawOne<{ total: string; count: string }>();
    return {
      alumniId,
      totalDonated: parseFloat(result?.total ?? '0'),
      donationCount: parseInt(result?.count ?? '0', 10),
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Donation ${id} not found`);
  }
}
