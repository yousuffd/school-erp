import { AttendanceService } from '../attendance.service';
import { AttendanceStatus } from '../entities/attendance-record.entity';

/**
 * Covers the one behavior in AttendanceService that isn't just a passthrough
 * to TypeORM: marking attendance for a student/class/date that already has a
 * record should UPDATE it, not create a duplicate second row (e.g. a teacher
 * correcting a mistake later in the day).
 */
describe('AttendanceService.markAttendance', () => {
  function makeService(existingRecord: any | null) {
    const saved: any[] = [];
    const repo: any = {
      findOne: jest.fn().mockResolvedValue(existingRecord),
      create: jest.fn().mockImplementation((dto) => ({ id: 'new-record', ...dto })),
      save: jest.fn().mockImplementation((r) => {
        saved.push(r);
        return Promise.resolve(r);
      }),
    };
    const studentRepo: any = {};
    // Empty array = the documented "unscoped" fallback (see
    // assertTeacherClassAccess) — this suite covers markAttendance's upsert
    // behavior specifically, not the class-scoping guard added alongside
    // it. An unscoped teacher-id keeps these tests focused on their
    // original concern rather than also needing timetable fixtures.
    const timetableService: any = {
      findClassIdsForTeacher: jest.fn().mockResolvedValue([]),
    };
    return { service: new AttendanceService(repo, studentRepo, timetableService), repo, saved };
  }

  const baseDto = {
    tenant_id: 'tenant-1',
    school_class_id: 'class-1',
    date: '2026-07-07',
    entries: [{ student_id: 'student-1', status: AttendanceStatus.ABSENT }],
  };

  it('creates a new record when none exists yet for that student/class/date', async () => {
    const { service, saved } = makeService(null);
    const result = await service.markAttendance(baseDto, 'teacher-1');
    expect(result).toHaveLength(1);
    expect(saved[0].id).toBe('new-record');
    expect(saved[0].status).toBe(AttendanceStatus.ABSENT);
  });

  it('updates the existing record in place instead of creating a duplicate', async () => {
    const existing = { id: 'existing-record', status: AttendanceStatus.PRESENT, marked_by: 'teacher-old' };
    const { service, saved } = makeService(existing);
    const result = await service.markAttendance(baseDto, 'teacher-1');
    expect(result).toHaveLength(1);
    // Same record id reused, not a new one — the "upsert" part of the guarantee.
    expect(saved[0].id).toBe('existing-record');
    expect(saved[0].status).toBe(AttendanceStatus.ABSENT);
    expect(saved[0].marked_by).toBe('teacher-1');
  });
});