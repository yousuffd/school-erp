import { BadRequestException } from '@nestjs/common';
import { ExamsService } from '../exams.service';

/**
 * Covers the one hand-written business rule in ExamsService.enterMarks: no
 * entry may exceed the exam's max_marks. A typo there (450 instead of 45)
 * would otherwise silently corrupt every downstream percentage/grade/
 * report-card calculation for that student.
 */
describe('ExamsService.enterMarks', () => {
  function makeService(examMaxMarks: string) {
    const examRepo: any = {
      findOne: jest.fn().mockResolvedValue({ id: 'exam-1', tenant_id: 'tenant-1', max_marks: examMaxMarks }),
    };
    const resultRepo: any = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ id: 'result-1', ...dto })),
      save: jest.fn().mockImplementation((r) => Promise.resolve(r)),
    };
    // enterMarks now routes through findOne(examId, enteredBy), which runs
    // the Teacher class-ownership check added this session. Mocking
    // findClassIdsForTeacher to return [] reproduces the "no timetable
    // assignments = unscoped" fallback, so these tests keep exercising only
    // the max-marks/negative-marks validation they were originally written
    // for, without needing a school_class_id on the mocked exam.
    const timetableService: any = {
      findClassIdsForTeacher: jest.fn().mockResolvedValue([]),
    };
    return { service: new ExamsService(examRepo, resultRepo, timetableService) };
  }

  it('accepts marks within the exam max', async () => {
    const { service } = makeService('50');
    const results = await service.enterMarks(
      { exam_id: 'exam-1', entries: [{ student_id: 'student-1', marks_obtained: '45' }] },
      'teacher-1',
    );
    expect(results).toHaveLength(1);
  });

  it('rejects marks that exceed the exam max', async () => {
    const { service } = makeService('50');
    await expect(
      service.enterMarks(
        { exam_id: 'exam-1', entries: [{ student_id: 'student-1', marks_obtained: '450' }] },
        'teacher-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects negative marks', async () => {
    const { service } = makeService('50');
    await expect(
      service.enterMarks(
        { exam_id: 'exam-1', entries: [{ student_id: 'student-1', marks_obtained: '-5' }] },
        'teacher-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts an omitted marks_obtained as absent, without validation', async () => {
    const { service } = makeService('50');
    const results = await service.enterMarks(
      { exam_id: 'exam-1', entries: [{ student_id: 'student-1' }] },
      'teacher-1',
    );
    expect(results[0].marks_obtained).toBeUndefined();
  });
});
