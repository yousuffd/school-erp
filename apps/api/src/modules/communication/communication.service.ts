import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudienceScope, Circular } from './entities/circular.entity';
import { CircularReadReceipt } from './entities/circular-read-receipt.entity';
import { CreateCircularDto } from './dto/create-circular.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(Circular) private readonly circularRepo: Repository<Circular>,
    @InjectRepository(CircularReadReceipt)
    private readonly receiptRepo: Repository<CircularReadReceipt>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {}

  private repo(): Repository<Circular> {
    return scopedRepo(this.circularRepo, Circular);
  }
  private receiptsRepo(): Repository<CircularReadReceipt> {
    return scopedRepo(this.receiptRepo, CircularReadReceipt);
  }
  private studentsRepo(): Repository<Student> {
    return scopedRepo(this.studentRepo, Student);
  }

  /**
   * Validates that the audience targeting is internally consistent — a
   * 'grade'-scoped circular with no grade specified (or vice versa) would
   * silently reach nobody or everybody, depending on how a query happened to
   * be written elsewhere. Worth catching here, once, rather than trusting
   * every future reader of this data to handle a malformed row gracefully.
   */
  async create(dto: CreateCircularDto, publishedBy: string): Promise<Circular> {
    if (dto.audience_scope === AudienceScope.GRADE && !dto.audience_grade_level) {
      throw new BadRequestException('audience_grade_level is required when audience_scope is "grade".');
    }
    if (dto.audience_scope === AudienceScope.CLASS && !dto.audience_school_class_id) {
      throw new BadRequestException('audience_school_class_id is required when audience_scope is "class".');
    }
    if (dto.audience_scope === AudienceScope.WHOLE_SCHOOL) {
      // Explicitly clear these rather than trust the caller not to send them —
      // a whole_school circular with a stray grade/class value attached would
      // be confusing to read back later.
      dto.audience_grade_level = undefined;
      dto.audience_school_class_id = undefined;
    }

    return this.repo().save(this.repo().create({ ...dto, published_by: publishedBy }));
  }

  /**
   * Teacher's visibility here is intentionally broad (any circular in the
   * tenant, not just ones targeting their own class) — same unscoped
   * pattern already flagged for Teacher's student-lifecycle/academic-
   * management view access, for the same reason: there's no teacher-to-class
   * assignment-aware query layer yet. Tightening this to "only circulars
   * relevant to a teacher's actual classes" is a real follow-up, not done here.
   */
  findAllForTenant(tenantId: string): Promise<Circular[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { published_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Circular> {
    const circular = await this.repo().findOne({ where: { id } });
    if (!circular) throw new NotFoundException(`Circular ${id} not found`);
    return circular;
  }

  /**
   * Self-service list for Student/Parent — same shape as ExamsService's
   * findResultsForStudent (resolved from the controller's my-circulars
   * route, which already validated the caller owns/is-linked-to this
   * studentId). Returns whole_school circulars + grade-scoped circulars
   * matching the student's grade_level + class-scoped circulars matching
   * their exact school_class_id — a strict superset a Student/Parent
   * should legitimately see, nothing narrower or broader.
   */
  async findForStudent(studentId: string): Promise<Circular[]> {
    const student = await this.studentsRepo().findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const qb = this.repo()
      .createQueryBuilder('c')
      .where('c.audience_scope = :wholeSchool', { wholeSchool: AudienceScope.WHOLE_SCHOOL });

    qb.orWhere('c.audience_scope = :grade AND c.audience_grade_level = :gradeLevel', {
      grade: AudienceScope.GRADE,
      gradeLevel: student.grade_level,
    });

    if (student.school_class_id) {
      qb.orWhere('c.audience_scope = :classScope AND c.audience_school_class_id = :classId', {
        classScope: AudienceScope.CLASS,
        classId: student.school_class_id,
      });
    }

    return qb.orderBy('c.published_at', 'DESC').getMany();
  }

  /**
   * Self-service read-marking counterpart to findForStudent — re-derives
   * the circular's actual audience and re-checks the student matches it,
   * rather than trusting the caller that a circular they're marking read
   * is genuinely one they were allowed to see (defense in depth; the
   * controller's studentId/parentOfStudentIds check happens first, but
   * that only proves the studentId is real and linked, not that THIS
   * circular is in that student's audience).
   */
  async markReadForStudent(circularId: string, studentId: string, userId: string): Promise<void> {
    const student = await this.studentsRepo().findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const circular = await this.findOne(circularId);
    const inAudience =
      circular.audience_scope === AudienceScope.WHOLE_SCHOOL ||
      (circular.audience_scope === AudienceScope.GRADE && circular.audience_grade_level === student.grade_level) ||
      (circular.audience_scope === AudienceScope.CLASS && circular.audience_school_class_id === student.school_class_id);

    if (!inAudience) {
      throw new NotFoundException(`Circular ${circularId} not found`);
    }

    await this.markRead(circularId, userId);
  }

  /** Idempotent — marking something already-read as read again is a no-op, not an error. */
  async markRead(circularId: string, userId: string): Promise<void> {
    const existing = await this.receiptsRepo().findOne({ where: { circular_id: circularId, user_id: userId } });
    if (existing) return;
    await this.receiptsRepo().save(this.receiptsRepo().create({ circular_id: circularId, user_id: userId }));
  }

  getReadReceipts(circularId: string): Promise<CircularReadReceipt[]> {
    return this.receiptsRepo().find({ where: { circular_id: circularId }, order: { read_at: 'ASC' } });
  }

  async remove(id: string): Promise<void> {
    const circular = await this.findOne(id);
    await this.repo().remove(circular);
  }
}
