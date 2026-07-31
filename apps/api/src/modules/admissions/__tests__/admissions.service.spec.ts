import { BadRequestException } from '@nestjs/common';
import { AdmissionsService } from '../admissions.service';
import { Admission, AdmissionStage } from '../entities/admission.entity';

/**
 * Covers the two hand-written business rules in AdmissionsService that have
 * no other safety net: the stage-transition guard (can't skip/reverse the
 * pipeline) and the enroll() precondition (only 'approved' applications can
 * become a Student).
 */
describe('AdmissionsService', () => {
  function makeService(admission: Partial<Admission>) {
    const stored = { id: 'adm-1', ...admission } as Admission;
    const repo: any = {
      findOne: jest.fn().mockResolvedValue(stored),
      save: jest.fn().mockImplementation((a) => Promise.resolve(a)),
      create: jest.fn().mockImplementation((dto) => dto),
      createQueryBuilder: jest.fn(),
    };
    const studentsService: any = {
      create: jest.fn().mockResolvedValue({ id: 'student-1' }),
    };
    const classesService: any = {
      findOrCreate: jest.fn().mockResolvedValue({ id: 'class-1' }),
    };
    const service = new AdmissionsService(repo, studentsService, classesService);
    return { service, repo, studentsService, classesService, stored };
  }

  it('allows a legal stage transition (under_review -> approved)', async () => {
    const { service } = makeService({ stage: AdmissionStage.UNDER_REVIEW });
    const result = await service.changeStage('adm-1', { stage: AdmissionStage.APPROVED });
    expect(result.stage).toBe(AdmissionStage.APPROVED);
  });

  it('rejects an illegal stage transition (inquiry -> enrolled)', async () => {
    const { service } = makeService({ stage: AdmissionStage.INQUIRY });
    await expect(service.changeStage('adm-1', { stage: AdmissionStage.ENROLLED })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects enrollment unless the application is in the approved stage', async () => {
    const { service } = makeService({ stage: AdmissionStage.UNDER_REVIEW });
    await expect(service.enroll('adm-1', { admission_number: 'ADM-1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('enrolls an approved application into a real Student, links it to a class, and marks it enrolled', async () => {
    const { service, studentsService, classesService, stored } = makeService({
      stage: AdmissionStage.APPROVED,
      tenant_id: 'tenant-1',
      campus_id: 'campus-1',
      applicant_first_name: 'Sarah',
      applicant_last_name: 'Yousuff',
      date_of_birth: '2016-10-29',
      desired_grade_level: 'Grade 5',
      academic_year_id: 'year-1',
      guardian_name: 'Sarver Yousuff',
      guardian_phone: '9876787689',
    });

    const result = await service.enroll('adm-1', { admission_number: 'ADM-2026-001', section: 'A' });

    expect(classesService.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ grade_level: 'Grade 5', section: 'A' }),
    );
    expect(studentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        admission_number: 'ADM-2026-001',
        first_name: 'Sarah',
        school_class_id: 'class-1',
      }),
    );
    expect(result.student.id).toBe('student-1');
    expect(result.admission.stage).toBe(AdmissionStage.ENROLLED);
    expect(result.admission.enrolled_student_id).toBe('student-1');
    void stored;
  });
});
