import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ChangeStudentStatusDto } from './dto/change-student-status.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { ClassesService } from '../classes/classes.service';

export interface StudentQuery {
  campusId?: string;
  gradeLevel?: string;
  status?: string;
  search?: string;
  schoolClassId?: string;
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    private readonly classesService: ClassesService,
  ) {}

  private repo(): Repository<Student> {
    return scopedRepo(this.studentRepo, Student);
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    // '||' not '??' — an empty string from a blank form field should also
    // trigger auto-generation, not be treated as a real (empty) admission number.
    const admissionNumber = dto.admission_number || (await this.nextAdmissionNumber(dto.tenant_id));

    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, admission_number: admissionNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Admission number ${admissionNumber} already exists for this tenant`,
      );
    }
    const student = this.repo().create({ ...dto, admission_number: admissionNumber });
    if (dto.school_class_id) {
      student.roll_number = await this.nextRollNumber(dto.tenant_id, dto.school_class_id);
    }
    return this.repo().save(student);
  }

  async findAllForTenant(tenantId: string, query: StudentQuery): Promise<Student[]> {
    const qb = this.repo()
      .createQueryBuilder('student')
      .where('student.tenant_id = :tenantId', { tenantId });

    if (query.campusId) qb.andWhere('student.campus_id = :campusId', { campusId: query.campusId });
    if (query.gradeLevel) qb.andWhere('student.grade_level = :gradeLevel', { gradeLevel: query.gradeLevel });
    if (query.status) qb.andWhere('student.status = :status', { status: query.status });
    if (query.schoolClassId) qb.andWhere('student.school_class_id = :schoolClassId', { schoolClassId: query.schoolClassId });
    if (query.search) {
      qb.andWhere(
        '(LOWER(student.first_name) LIKE :search OR LOWER(student.last_name) LIKE :search OR LOWER(student.admission_number) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    return qb.orderBy('student.last_name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.repo().findOne({ where: { id } });
    if (!student) throw new NotFoundException(`Student ${id} not found`);
    return student;
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    if (dto.admission_number && dto.admission_number !== student.admission_number) {
      const existing = await this.repo().findOne({
        where: { tenant_id: student.tenant_id, admission_number: dto.admission_number },
      });
      if (existing) {
        throw new ConflictException(
          `Admission number ${dto.admission_number} already exists for this tenant`,
        );
      }
    }
    Object.assign(student, dto);
    return this.repo().save(student);
  }

  /**
   * Dedicated endpoint for lifecycle transitions (transfer/withdraw/graduate)
   * rather than folding this into the general update — these are workflow
   * events worth being explicit and auditable about, not incidental field edits.
   */
  async changeStatus(id: string, dto: ChangeStudentStatusDto): Promise<Student> {
    const student = await this.findOne(id);
    student.status = dto.status;
    return this.repo().save(student);
  }

  /**
   * Dedicated endpoint for linking a student to a formal SchoolClass — same
   * reasoning as changeStatus above: a real roster-assignment event, not an
   * incidental field edit, and it's what Attendance's roster depends on.
   * Also (re)computes roll_number for the new class, AND syncs the
   * denormalized grade_level/section strings to match the actual class —
   * previously this only set school_class_id, leaving grade_level/section
   * to silently drift out of sync with whatever class the student was
   * really linked to. This is the one and only place those strings should
   * change now; the general edit form no longer lets them be edited
   * independently, precisely because that drift caused real confusion.
   */
  async assignClass(id: string, dto: AssignClassDto): Promise<Student> {
    const student = await this.findOne(id);
    const targetClass = await this.classesService.findOne(dto.school_class_id);
    student.school_class_id = dto.school_class_id;
    student.grade_level = targetClass.grade_level;
    student.section = targetClass.section;
    student.roll_number = await this.nextRollNumber(student.tenant_id, dto.school_class_id);
    return this.repo().save(student);
  }

  /**
   * Never accepted from a client (no roll_number field on any DTO) —
   * auto-assigned only, so duplicates are structurally impossible rather
   * than "shouldn't happen if the UI behaves." Backed by a DB-level unique
   * constraint on (tenant, school_class_id, roll_number) as defense in depth.
   */
  private async nextRollNumber(tenantId: string, schoolClassId: string): Promise<number> {
    const result = await this.repo()
      .createQueryBuilder('student')
      .select('MAX(student.roll_number)', 'max')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('student.school_class_id = :schoolClassId', { schoolClassId })
      .getRawOne<{ max: number | null }>();
    return (result?.max ?? 0) + 1;
  }

  /**
   * Format: ADM-{calendar year}-{3-digit sequence}, e.g. ADM-2026-001 —
   * matches the format already shown as placeholder text in the frontend
   * form. Sequence resets per calendar year (not academic year — simpler,
   * matches how most real admission-number schemes work). String-sorting
   * DESC on admission_number works correctly here because the year+prefix
   * length is fixed and the sequence is always zero-padded to the same
   * width, so string order matches numeric order.
   */
  private async nextAdmissionNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ADM-${year}-`;
    const result = await this.repo()
      .createQueryBuilder('student')
      .select('student.admission_number', 'admission_number')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('student.admission_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('student.admission_number', 'DESC')
      .getRawOne<{ admission_number: string }>();

    let nextSeq = 1;
    if (result?.admission_number) {
      const match = result.admission_number.match(/-(\d+)$/);
      if (match) nextSeq = parseInt(match[1], 10) + 1;
    }
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Genuine hard delete — for a student record created by mistake (wrong
   * person entirely, duplicate entry), not for someone who actually left the
   * school (that's the withdrawn/transferred status workflow above, which
   * preserves the record). Attendance records cascade-delete with the
   * student (see attendance_records' FK); any Admission that led to this
   * student keeps its own record but loses the enrolled_student_id link
   * (ON DELETE SET NULL) rather than being deleted itself.
   */
  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.repo().remove(student);
  }
}
