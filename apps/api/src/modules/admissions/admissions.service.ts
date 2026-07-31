import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admission, AdmissionStage } from './entities/admission.entity';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { ChangeAdmissionStageDto } from './dto/change-admission-stage.dto';
import { EnrollAdmissionDto } from './dto/enroll-admission.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { Student } from '../students/entities/student.entity';
import { ClassesService } from '../classes/classes.service';

export interface AdmissionQuery {
  campusId?: string;
  stage?: string;
  search?: string;
}

/**
 * Legal stage transitions for the admissions pipeline. Kept explicit and
 * enforced server-side (not just suggested in the UI) so the pipeline can't
 * be pushed into a nonsensical state (e.g. "rejected" -> "enrolled") from
 * either the UI or a direct API call.
 */
const ALLOWED_TRANSITIONS: Record<AdmissionStage, AdmissionStage[]> = {
  [AdmissionStage.INQUIRY]: [AdmissionStage.APPLICATION_SUBMITTED, AdmissionStage.WITHDRAWN],
  [AdmissionStage.APPLICATION_SUBMITTED]: [AdmissionStage.UNDER_REVIEW, AdmissionStage.WITHDRAWN],
  [AdmissionStage.UNDER_REVIEW]: [
    AdmissionStage.WAITLISTED,
    AdmissionStage.APPROVED,
    AdmissionStage.REJECTED,
  ],
  [AdmissionStage.WAITLISTED]: [AdmissionStage.APPROVED, AdmissionStage.REJECTED],
  [AdmissionStage.APPROVED]: [AdmissionStage.WITHDRAWN], // enrollment happens via the dedicated /enroll endpoint, not a stage PATCH
  [AdmissionStage.REJECTED]: [],
  [AdmissionStage.ENROLLED]: [],
  [AdmissionStage.WITHDRAWN]: [],
};

@Injectable()
export class AdmissionsService {
  constructor(
    @InjectRepository(Admission) private readonly admissionRepo: Repository<Admission>,
    private readonly studentsService: StudentsService,
    private readonly classesService: ClassesService,
  ) {}

  private repo(): Repository<Admission> {
    return scopedRepo(this.admissionRepo, Admission);
  }

  create(dto: CreateAdmissionDto): Promise<Admission> {
    return this.repo().save(this.repo().create(dto));
  }

  async findAllForTenant(tenantId: string, query: AdmissionQuery): Promise<Admission[]> {
    const qb = this.repo()
      .createQueryBuilder('admission')
      .where('admission.tenant_id = :tenantId', { tenantId });

    if (query.campusId) qb.andWhere('admission.campus_id = :campusId', { campusId: query.campusId });
    if (query.stage) qb.andWhere('admission.stage = :stage', { stage: query.stage });
    if (query.search) {
      qb.andWhere(
        '(LOWER(admission.applicant_first_name) LIKE :search OR LOWER(admission.applicant_last_name) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    return qb.orderBy('admission.created_at', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Admission> {
    const admission = await this.repo().findOne({ where: { id } });
    if (!admission) throw new NotFoundException(`Admission ${id} not found`);
    return admission;
  }

  async update(id: string, dto: UpdateAdmissionDto): Promise<Admission> {
    const admission = await this.findOne(id);
    Object.assign(admission, dto);
    return this.repo().save(admission);
  }

  async changeStage(id: string, dto: ChangeAdmissionStageDto): Promise<Admission> {
    const admission = await this.findOne(id);
    const allowed = ALLOWED_TRANSITIONS[admission.stage];
    if (!allowed.includes(dto.stage)) {
      throw new BadRequestException(
        `Cannot move an admission from '${admission.stage}' to '${dto.stage}'. ` +
          `Allowed next stages: ${allowed.length ? allowed.join(', ') : 'none — this is a final stage'}.`,
      );
    }
    admission.stage = dto.stage;
    return this.repo().save(admission);
  }

  /**
   * The actual bridge between Admissions and Student Lifecycle: turns an
   * approved application into a real Student record. Only legal from the
   * 'approved' stage — enrollment isn't a generic stage change because it has
   * a side effect (creating a Student), unlike every other transition above.
   *
   * Also links the new student to a real SchoolClass automatically (finding
   * or creating one matching the admission's grade/section) — previously
   * this was left unset, meaning every enrolled student needed a manual
   * "assign to class" follow-up before Attendance could work for them. Fixed
   * after this exact gap caused a real point of confusion during testing.
   */
  async enroll(id: string, dto: EnrollAdmissionDto): Promise<{ admission: Admission; student: Student }> {
    const admission = await this.findOne(id);
    if (admission.stage !== AdmissionStage.APPROVED) {
      throw new BadRequestException(
        `Only approved applications can be enrolled (current stage: '${admission.stage}').`,
      );
    }

    const schoolClass = await this.classesService.findOrCreate({
      tenant_id: admission.tenant_id,
      campus_id: admission.campus_id,
      academic_year_id: admission.academic_year_id,
      grade_level: admission.desired_grade_level,
      section: dto.section,
    });

    const student = await this.studentsService.create({
      tenant_id: admission.tenant_id,
      campus_id: admission.campus_id,
      admission_number: dto.admission_number,
      first_name: admission.applicant_first_name,
      last_name: admission.applicant_last_name,
      date_of_birth: admission.date_of_birth,
      grade_level: admission.desired_grade_level,
      section: dto.section,
      school_class_id: schoolClass.id,
      academic_year_id: admission.academic_year_id,
      enrollment_date: new Date().toISOString().slice(0, 10),
      guardian_name: admission.guardian_name,
      guardian_phone: admission.guardian_phone,
      guardian_email: admission.guardian_email,
    });

    admission.stage = AdmissionStage.ENROLLED;
    admission.enrolled_student_id = student.id;
    const savedAdmission = await this.repo().save(admission);

    return { admission: savedAdmission, student };
  }
}
