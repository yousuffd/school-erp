import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffCertification } from './entities/staff-certification.entity';
import { CreateStaffCertificationDto } from './dto/create-staff-certification.dto';
import { UpdateStaffCertificationDto } from './dto/update-staff-certification.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class StaffCertificationsService {
  constructor(
    @InjectRepository(StaffCertification) private readonly repoRaw: Repository<StaffCertification>,
  ) {}

  private repo(): Repository<StaffCertification> {
    return scopedRepo(this.repoRaw, StaffCertification);
  }

  create(dto: CreateStaffCertificationDto): Promise<StaffCertification> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, employeeId?: string): Promise<StaffCertification[]> {
    const where: any = { tenant_id: tenantId };
    if (employeeId) where.employee_id = employeeId;
    return this.repo().find({ where, order: { expiry_date: 'ASC' } });
  }

  async update(id: string, dto: UpdateStaffCertificationDto): Promise<StaffCertification> {
    const cert = await this.repo().findOne({ where: { id } });
    if (!cert) throw new NotFoundException(`Certification ${id} not found`);
    Object.assign(cert, dto);
    return this.repo().save(cert);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Certification ${id} not found`);
  }

  /**
   * Renewal alerts (blueprint core feature): computed at query time from
   * expiry_date, not a stored flag — see entity comment. Cutoff computed in
   * JS rather than raw SQL date arithmetic, per this project's own
   * documented lesson (raw SQL date handling needs explicit to_char() casts
   * to avoid timezone-shift bugs — simplest to just avoid it here entirely).
   */
  findExpiringSoon(tenantId: string, daysAhead = 30): Promise<StaffCertification[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    return this.repo()
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.expiry_date IS NOT NULL')
      .andWhere('c.expiry_date <= :cutoff', { cutoff: cutoffStr })
      .orderBy('c.expiry_date', 'ASC')
      .getMany();
  }
}