import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentStudentLink } from './entities/parent-student-link.entity';
import { CreateParentStudentLinkDto } from './dto/create-parent-student-link.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class ParentStudentLinksService {
  constructor(
    @InjectRepository(ParentStudentLink) private readonly linkRepo: Repository<ParentStudentLink>,
  ) {}

  private repo(): Repository<ParentStudentLink> {
    return scopedRepo(this.linkRepo, ParentStudentLink);
  }

  async create(dto: CreateParentStudentLinkDto): Promise<ParentStudentLink> {
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, parent_user_id: dto.parent_user_id, student_id: dto.student_id },
    });
    if (existing) {
      throw new ConflictException('This parent is already linked to this student.');
    }
    return this.repo().save(this.repo().create(dto));
  }

  findForParent(tenantId: string, parentUserId: string): Promise<ParentStudentLink[]> {
    return this.repo().find({ where: { tenant_id: tenantId, parent_user_id: parentUserId } });
  }

  /**
   * Used by AuthService at login time to build the JWT's
   * parentOfStudentIds claim — a plain array of student_id strings, not
   * full link records. Deliberately NOT called again on refresh() (same
   * staleness tradeoff studentId already has — see AuthService).
   */
  async findStudentIdsForParent(tenantId: string, parentUserId: string): Promise<string[]> {
    const links = await this.findForParent(tenantId, parentUserId);
    return links.map((l) => l.student_id);
  }

  findForStudent(tenantId: string, studentId: string): Promise<ParentStudentLink[]> {
    return this.repo().find({ where: { tenant_id: tenantId, student_id: studentId } });
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const link = await this.repo().findOne({ where: { id } });
    if (!link) throw new NotFoundException(`Parent-student link ${id} not found`);
    await this.repo().delete(id);
    return { deleted: true };
  }
}
