import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorshipMatch } from './entities/mentorship-match.entity';
import { CreateMentorshipMatchDto } from './dto/create-mentorship-match.dto';
import { UpdateMentorshipMatchStatusDto } from './dto/update-mentorship-match-status.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class MentorshipMatchesService {
  constructor(@InjectRepository(MentorshipMatch) private readonly repo_: Repository<MentorshipMatch>) {}

  private repo(): Repository<MentorshipMatch> {
    return scopedRepo(this.repo_, MentorshipMatch);
  }

  create(dto: CreateMentorshipMatchDto): Promise<MentorshipMatch> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<MentorshipMatch[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async updateStatus(id: string, dto: UpdateMentorshipMatchStatusDto): Promise<MentorshipMatch> {
    const match = await this.repo().findOne({ where: { id } });
    if (!match) throw new NotFoundException(`Mentorship match ${id} not found`);
    match.status = dto.status;
    return this.repo().save(match);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Mentorship match ${id} not found`);
  }
}
