import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Assignment } from './entities/assignment.entity';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TimetableService } from '../timetable/timetable.service';
import { assertTeacherClassSubjectAccess } from '../../common/utils/teacher-class-scope.util';

@Injectable()
export class AssignmentSubmissionsService {
  constructor(
    @InjectRepository(AssignmentSubmission) private readonly submissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(Assignment) private readonly assignmentRepo: Repository<Assignment>,
    private readonly studentsService: StudentsService,
    private readonly timetableService: TimetableService,
  ) {}

  private submissionsRepo(): Repository<AssignmentSubmission> {
    return scopedRepo(this.submissionRepo, AssignmentSubmission);
  }
  private assignmentsRepo(): Repository<Assignment> {
    return scopedRepo(this.assignmentRepo, Assignment);
  }

  /**
   * Self-submit / resubmit. studentId comes from the verified JWT
   * (req.user.studentId), never from the request body — see the entity's
   * doc comment for why this is the one deliberate exception to this
   * project's usual client-supplies-the-id pattern.
   */
  async submit(
    assignmentId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ): Promise<AssignmentSubmission> {
    if (!user.studentId) {
      throw new ForbiddenException('This account is not linked to a student record.');
    }

    const assignment = await this.assignmentsRepo().findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException(`Assignment ${assignmentId} not found`);

    // Defense in depth: even though the frontend would only ever show a
    // student their own class's assignments (via findForStudent), verify
    // server-side too — nothing stops a crafted request naming a
    // different assignment_id.
    const student = await this.studentsService.findOne(user.studentId);
    if (student.school_class_id !== assignment.school_class_id) {
      throw new ForbiddenException('This assignment is not assigned to your class.');
    }

    const isLate = new Date() > new Date(assignment.due_date);

    const existing = await this.submissionsRepo().findOne({
      where: { tenant_id: user.tenantId, assignment_id: assignmentId, student_id: user.studentId },
    });

    if (existing) {
      if (existing.graded_at) {
        throw new BadRequestException('This assignment has already been graded — it can no longer be resubmitted.');
      }
      // Replace the old file on disk before overwriting the row's reference to it.
      if (existsSync(existing.file_path)) {
        await unlink(existing.file_path).catch(() => undefined);
      }
      existing.file_path = file.path;
      existing.original_filename = file.originalname;
      existing.mime_type = file.mimetype;
      existing.file_size = file.size;
      existing.submitted_at = new Date();
      existing.is_late = isLate;
      existing.uploaded_by = user.userId;
      return this.submissionsRepo().save(existing);
    }

    const submission = this.submissionsRepo().create({
      tenant_id: user.tenantId,
      assignment_id: assignmentId,
      student_id: user.studentId,
      file_path: file.path,
      original_filename: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      is_late: isLate,
      uploaded_by: user.userId,
    });
    return this.submissionsRepo().save(submission);
  }

  /** Self-service: the calling student's own submissions across all assignments, or filtered to one. */
  findMine(user: AuthenticatedUser, assignmentId?: string): Promise<AssignmentSubmission[]> {
    if (!user.studentId) {
      throw new ForbiddenException('This account is not linked to a student record.');
    }
    return this.submissionsRepo().find({
      where: assignmentId
        ? { tenant_id: user.tenantId, student_id: user.studentId, assignment_id: assignmentId }
        : { tenant_id: user.tenantId, student_id: user.studentId },
      order: { submitted_at: 'DESC' },
    });
  }

  /**
   * Staff roster view — every submission for one assignment, for grading.
   * Teacher-class-AND-subject-scoped: a teacher may only pull the roster
   * for an assignment whose class AND subject they're timetabled to
   * teach — a teacher covering Math in a class shouldn't see Science
   * submissions in that same class. No-ops (unscoped) for
   * Admin/unassigned-teacher callers per the shared util.
   */
  async findByAssignment(assignmentId: string, user: AuthenticatedUser): Promise<AssignmentSubmission[]> {
    const assignment = await this.assignmentsRepo().findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException(`Assignment ${assignmentId} not found`);

    await assertTeacherClassSubjectAccess(
      this.timetableService,
      user.tenantId,
      user.userId,
      assignment.school_class_id,
      assignment.subject_id,
    );

    return this.submissionsRepo().find({
      where: { assignment_id: assignmentId },
      order: { submitted_at: 'ASC' },
    });
  }

  /**
   * Teacher-class-AND-subject-scoped: grading is gated to the
   * assignment's own class AND subject, not just the lms:edit permission
   * tenant-wide, and not just class (a teacher covering a different
   * subject in this same class shouldn't be able to grade it either).
   */
  async grade(submissionId: string, dto: GradeSubmissionDto, user: AuthenticatedUser): Promise<AssignmentSubmission> {
    const submission = await this.submissionsRepo().findOne({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException(`Submission ${submissionId} not found`);

    const assignment = await this.assignmentsRepo().findOne({ where: { id: submission.assignment_id } });
    if (!assignment) throw new NotFoundException(`Assignment ${submission.assignment_id} not found`);

    await assertTeacherClassSubjectAccess(
      this.timetableService,
      user.tenantId,
      user.userId,
      assignment.school_class_id,
      assignment.subject_id,
    );

    if (dto.score > parseFloat(assignment.max_score)) {
      throw new BadRequestException(
        `Score (${dto.score}) cannot exceed this assignment's max score (${assignment.max_score}).`,
      );
    }

    submission.score = String(dto.score);
    submission.feedback = dto.feedback;
    submission.graded_by = user.userId;
    submission.graded_at = new Date();
    return this.submissionsRepo().save(submission);
  }

  /**
   * Dual authorization: a staff member with lms:view, OR the student who
   * owns this exact submission. No @Permissions() decorator on the
   * controller route for this reason — the check has to be an OR across
   * two different authorization models, which the declarative decorator
   * alone can't express.
   *
   * Teacher-class-AND-subject-scoping: the lms:view permission check
   * alone let any teacher with that permission download any student's
   * file tenant-wide. Now, once a caller clears the isOwner-OR-
   * isStaffWithAccess gate on the staff branch, a second check confirms
   * the assignment's class AND subject is one the teacher is actually
   * timetabled to teach — not just the class, since a different subject
   * teacher sharing that class shouldn't reach this student's file either
   * (no-ops for Admin/unassigned-teacher callers).
   */
  async getFileForDownload(
    submissionId: string,
    user: AuthenticatedUser,
  ): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const submission = await this.submissionsRepo().findOne({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException(`Submission ${submissionId} not found`);

    const isOwner = user.studentId && user.studentId === submission.student_id;
    const isStaffWithAccess = (user.permissions ?? []).some((p) => p.module === 'lms' && p.action === 'view');

    if (!isOwner && !isStaffWithAccess) {
      throw new ForbiddenException('You do not have access to this submission.');
    }

    if (!isOwner) {
      const assignment = await this.assignmentsRepo().findOne({ where: { id: submission.assignment_id } });
      if (assignment) {
        await assertTeacherClassSubjectAccess(
          this.timetableService,
          user.tenantId,
          user.userId,
          assignment.school_class_id,
          assignment.subject_id,
        );
      }
    }

    return {
      filePath: submission.file_path,
      filename: submission.original_filename,
      mimeType: submission.mime_type,
    };
  }
}