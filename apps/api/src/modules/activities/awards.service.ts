import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Award } from './entities/award.entity';
import { CreateAwardDto } from './dto/create-award.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class AwardsService {
  constructor(@InjectRepository(Award) private readonly awardRepo: Repository<Award>) {}

  private repo(): Repository<Award> {
    return scopedRepo(this.awardRepo, Award);
  }

  create(dto: CreateAwardDto, issuedBy: string): Promise<Award> {
    return this.repo().save(this.repo().create({ ...dto, issued_by: issuedBy }));
  }

  findAllForTenant(tenantId: string, studentId?: string): Promise<Award[]> {
    const where: any = { tenant_id: tenantId };
    if (studentId) where.student_id = studentId;
    return this.repo().find({ where, order: { awarded_date: 'DESC' } });
  }

  findForStudent(studentId: string): Promise<Award[]> {
    return this.repo().find({ where: { student_id: studentId }, order: { awarded_date: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Award ${id} not found`);
  }
}
