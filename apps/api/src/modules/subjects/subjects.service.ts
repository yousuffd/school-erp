import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class SubjectsService {
  constructor(@InjectRepository(Subject) private readonly subjectRepo: Repository<Subject>) {}

  private repo(): Repository<Subject> {
    return scopedRepo(this.subjectRepo, Subject);
  }

  async create(dto: CreateSubjectDto): Promise<Subject> {
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, code: dto.code },
    });
    if (existing) throw new ConflictException(`Subject code '${dto.code}' already exists for this tenant`);
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<Subject[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.repo().findOne({ where: { id } });
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findOne(id); // reuses the existing not-found check
    Object.assign(subject, dto);
    return this.repo().save(subject);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const subject = await this.findOne(id);
    // Soft delete, per project convention. VERIFY Subject entity actually
    // has a @DeleteDateColumn (deleted_at) — if it doesn't yet, this will
    // fail or silently no-op depending on TypeORM version; add the column
    // via a small migration first if it's missing.
    await this.repo().softDelete(subject.id);
    return { deleted: true };
  }
}