import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HostelVisitor } from './entities/hostel-visitor.entity';
import { CreateHostelVisitorDto } from './dto/create-hostel-visitor.dto';
import { scopedRepo } from '../../common/context/tenant-context';


function generatePassCode(): string {
  // Software-only pass — 6-char alphanumeric, no physical hardware assumed.
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

@Injectable()
export class HostelVisitorsService {
  constructor(@InjectRepository(HostelVisitor) private readonly visitorRepo: Repository<HostelVisitor>) {}

  private repo(): Repository<HostelVisitor> {
    return scopedRepo(this.visitorRepo, HostelVisitor);
  }

  create(dto: CreateHostelVisitorDto): Promise<HostelVisitor> {
    return this.repo().save(this.repo().create({ ...dto, pass_code: generatePassCode() }));
  }

  findAllForTenant(tenantId: string, studentId?: string): Promise<HostelVisitor[]> {
    const where: any = { tenant_id: tenantId };
    if (studentId) where.student_id = studentId;
    return this.repo().find({ where, order: { check_in_time: 'DESC' } });
  }

  async checkOut(id: string, checkOutTime: string): Promise<HostelVisitor> {
    const visitor = await this.repo().findOne({ where: { id } });
    if (!visitor) throw new NotFoundException(`Visitor record ${id} not found`);
    visitor.check_out_time = new Date(checkOutTime);
    return this.repo().save(visitor);
  }

  async verify(id: string): Promise<HostelVisitor> {
    const visitor = await this.repo().findOne({ where: { id } });
    if (!visitor) throw new NotFoundException(`Visitor record ${id} not found`);
    visitor.verified = true;
    return this.repo().save(visitor);
  }
}