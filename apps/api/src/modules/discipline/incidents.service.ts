import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BehaviorIncident } from './entities/behavior-incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class IncidentsService {
  constructor(@InjectRepository(BehaviorIncident) private readonly incidentRepo: Repository<BehaviorIncident>) {}

  private repo(): Repository<BehaviorIncident> {
    return scopedRepo(this.incidentRepo, BehaviorIncident);
  }

  create(dto: CreateIncidentDto, reportedBy: string): Promise<BehaviorIncident> {
    return this.repo().save(this.repo().create({ ...dto, reported_by: reportedBy }));
  }

  findAllForTenant(tenantId: string, studentId?: string): Promise<BehaviorIncident[]> {
    const where: any = { tenant_id: tenantId };
    if (studentId) where.student_id = studentId;
    return this.repo().find({ where, order: { incident_date: 'DESC' } });
  }

  findForStudent(studentId: string): Promise<BehaviorIncident[]> {
    return this.repo().find({ where: { student_id: studentId }, order: { incident_date: 'DESC' } });
  }

  async findOne(id: string): Promise<BehaviorIncident> {
    const incident = await this.repo().findOne({ where: { id } });
    if (!incident) throw new NotFoundException(`Incident ${id} not found`);
    return incident;
  }

  async updateStatus(id: string, dto: UpdateIncidentStatusDto): Promise<BehaviorIncident> {
    const incident = await this.findOne(id);
    incident.status = dto.status;
    return this.repo().save(incident);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Incident ${id} not found`);
  }

  /**
   * Computed live, NOT stored — SUM of every incident's points for this
   * student. Matches FeeBalance's existing compute-on-read convention
   * rather than risking a cached running total drifting out of sync with
   * the underlying incident rows (e.g. if an incident is later deleted or
   * its status escalated/resolved after points were already tallied).
   */
  async getPointsBalance(studentId: string): Promise<{ studentId: string; pointsBalance: number; incidentCount: number }> {
    const result = await this.repo()
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.points), 0)', 'total')
      .addSelect('COUNT(i.id)', 'count')
      .where('i.student_id = :studentId', { studentId })
      .getRawOne<{ total: string; count: string }>();

    return {
      studentId,
      pointsBalance: parseInt(result?.total ?? '0', 10),
      incidentCount: parseInt(result?.count ?? '0', 10),
    };
  }
}
