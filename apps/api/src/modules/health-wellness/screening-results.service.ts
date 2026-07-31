import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScreeningResult } from './entities/screening-result.entity';
import { Student } from '../students/entities/student.entity';
import { CreateScreeningResultDto } from './dto/create-screening-result.dto';
import { UpdateScreeningResultDto } from './dto/update-screening-result.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { getScopedStudentIds } from '../../common/utils/teacher-student-scope.util';

@Injectable()
export class ScreeningResultsService {
  constructor(
    @InjectRepository(ScreeningResult) private readonly resultRepo: Repository<ScreeningResult>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<ScreeningResult> {
    return scopedRepo(this.resultRepo, ScreeningResult);
  }

  create(dto: CreateScreeningResultDto, recordedBy: string): Promise<ScreeningResult> {
    return this.repo().save(this.repo().create({ ...dto, recorded_by: recordedBy }));
  }

  async findForCampaign(campaignId: string, tenantId: string, teacherId?: string): Promise<ScreeningResult[]> {
    const qb = this.repo().createQueryBuilder('r').where('r.campaign_id = :campaignId', { campaignId });
    if (teacherId) {
      const scopedIds = await getScopedStudentIds(this.timetableService, this.studentRepo, tenantId, teacherId);
      if (scopedIds !== null) qb.andWhere('r.student_id IN (:...ids)', { ids: scopedIds.length ? scopedIds : [null] });
    }
    return qb.getMany();
  }

  async update(id: string, dto: UpdateScreeningResultDto): Promise<ScreeningResult> {
    const result = await this.repo().findOne({ where: { id } });
    if (!result) throw new NotFoundException(`Screening result ${id} not found`);
    Object.assign(result, dto);
    return this.repo().save(result);
  }
}
