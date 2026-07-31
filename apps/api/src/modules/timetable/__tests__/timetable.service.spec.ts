import { ConflictException } from '@nestjs/common';
import { TimetableService } from '../timetable.service';
import { DayOfWeek } from '../entities/timetable-slot.entity';

/**
 * Covers the one hand-written business rule in TimetableService that a DB
 * unique constraint alone can't express: a teacher can't be scheduled into
 * two different classes during the same day/period.
 */
describe('TimetableService', () => {
  function makeService(existingSlot: any | null) {
    const repo: any = {
      findOne: jest.fn().mockResolvedValue(existingSlot),
      save: jest.fn().mockImplementation((s) => Promise.resolve({ id: 'slot-1', ...s })),
      create: jest.fn().mockImplementation((dto) => dto),
      remove: jest.fn(),
    };
    const emptyRepo: any = {};
    return { service: new TimetableService(repo, emptyRepo, emptyRepo, emptyRepo), repo };
  }

  const baseDto = {
    tenant_id: 'tenant-1',
    school_class_id: 'class-1',
    subject_id: 'subject-1',
    teacher_id: 'teacher-1',
    day_of_week: DayOfWeek.MONDAY,
    period_number: 1,
  };

  it('creates a slot when the teacher has no conflicting slot at that day/period', async () => {
    const { service } = makeService(null);
    const result = await service.create(baseDto);
    expect(result.teacher_id).toBe('teacher-1');
  });

  it('rejects a slot when the teacher already has another class at the same day/period', async () => {
    const { service } = makeService({ id: 'existing-slot', teacher_id: 'teacher-1' });
    await expect(service.create(baseDto)).rejects.toThrow(ConflictException);
  });
});

/**
 * Covers the AI Timetable Optimizer beta's placement logic — the part of
 * this session's build with the most hand-written algorithmic behavior, so
 * it gets the most scrutiny here: never colliding with pre-existing slots
 * (class- or teacher-side), spreading periods across distinct days before
 * doubling up on any one day, and honestly reporting anything it couldn't
 * place rather than silently dropping it.
 */
describe('TimetableService.generateSchedule', () => {
  function makeScheduleService(existingSlots: any[]) {
    const repo: any = {
      find: jest.fn().mockResolvedValue(existingSlots),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((s) =>
        Promise.resolve(
          Array.isArray(s) ? s.map((row, i) => ({ id: `new-slot-${i}`, ...row })) : { id: 'new-slot-0', ...s },
        ),
      ),
    };
    const emptyRepo: any = {};
    return { service: new TimetableService(repo, emptyRepo, emptyRepo, emptyRepo), repo };
  }

  it('does not schedule a class into a day/period it already occupies', async () => {
    const existing = [
      {
        tenant_id: 'tenant-1',
        school_class_id: 'class-1',
        teacher_id: 'teacher-other',
        day_of_week: DayOfWeek.MONDAY,
        period_number: 1,
      },
    ];
    const { service } = makeScheduleService(existing);

    const result = await service.generateSchedule(
      'tenant-1',
      [{ school_class_id: 'class-1', subject_id: 'subject-2', teacher_id: 'teacher-1', periods_per_week: 1 }],
      [DayOfWeek.MONDAY],
      1, // only one period in the day, and it's already taken for this class
    );

    expect(result.created).toHaveLength(0);
    expect(result.unscheduled).toEqual([
      {
        requirement: { school_class_id: 'class-1', subject_id: 'subject-2', teacher_id: 'teacher-1', periods_per_week: 1 },
        periods_placed: 0,
        periods_requested: 1,
      },
    ]);
  });

  it('does not double-book a teacher across two different classes at the same day/period', async () => {
    const existing = [
      {
        tenant_id: 'tenant-1',
        school_class_id: 'class-A',
        teacher_id: 'teacher-1',
        day_of_week: DayOfWeek.MONDAY,
        period_number: 1,
      },
    ];
    const { service } = makeScheduleService(existing);

    // class-B is free at Monday P1 — but teacher-1 is already busy with
    // class-A at that exact slot, so this must be refused too.
    const result = await service.generateSchedule(
      'tenant-1',
      [{ school_class_id: 'class-B', subject_id: 'subject-1', teacher_id: 'teacher-1', periods_per_week: 1 }],
      [DayOfWeek.MONDAY],
      1,
    );

    expect(result.created).toHaveLength(0);
    expect(result.unscheduled[0].periods_placed).toBe(0);
  });

  it('spreads periods across distinct days before doubling up on any one day', async () => {
    const { service } = makeScheduleService([]);

    const result = await service.generateSchedule(
      'tenant-1',
      [{ school_class_id: 'class-1', subject_id: 'subject-1', teacher_id: 'teacher-1', periods_per_week: 3 }],
      [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      8,
    );

    expect(result.created).toHaveLength(3);
    expect(result.unscheduled).toHaveLength(0);
    const distinctDays = new Set(result.created.map((s: any) => s.day_of_week));
    expect(distinctDays.size).toBe(3); // three periods requested, three days available — no day should repeat
  });

  it('falls back to doubling up on a day only once distinct days are exhausted', async () => {
    const { service } = makeScheduleService([]);

    // Only 2 days available, but 3 periods requested — the third HAS to
    // repeat a day.
    const result = await service.generateSchedule(
      'tenant-1',
      [{ school_class_id: 'class-1', subject_id: 'subject-1', teacher_id: 'teacher-1', periods_per_week: 3 }],
      [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
      8,
    );

    expect(result.created).toHaveLength(3);
    expect(result.unscheduled).toHaveLength(0);
    const distinctDays = new Set(result.created.map((s: any) => s.day_of_week));
    expect(distinctDays.size).toBe(2); // both days used, one of them necessarily twice
  });

  it('reports a requirement as unscheduled (with a partial count) rather than dropping it silently when it cannot be fully placed', async () => {
    const { service } = makeScheduleService([]);

    // Single day, single period — only one requirement can win the only
    // available slot for this teacher; the other must be reported, not
    // dropped.
    const result = await service.generateSchedule(
      'tenant-1',
      [
        { school_class_id: 'class-A', subject_id: 'subject-1', teacher_id: 'teacher-1', periods_per_week: 1 },
        { school_class_id: 'class-B', subject_id: 'subject-1', teacher_id: 'teacher-1', periods_per_week: 1 },
      ],
      [DayOfWeek.MONDAY],
      1,
    );

    expect(result.created).toHaveLength(1);
    expect(result.unscheduled).toHaveLength(1);
    expect(result.unscheduled[0].periods_placed).toBe(0);
    expect(result.unscheduled[0].periods_requested).toBe(1);
  });

  it('never touches or removes existing slots — only adds new ones', async () => {
    const existing = [
      {
        tenant_id: 'tenant-1',
        school_class_id: 'class-1',
        teacher_id: 'teacher-1',
        day_of_week: DayOfWeek.MONDAY,
        period_number: 1,
      },
    ];
    const { service, repo } = makeScheduleService(existing);

    await service.generateSchedule(
      'tenant-1',
      [{ school_class_id: 'class-1', subject_id: 'subject-2', teacher_id: 'teacher-2', periods_per_week: 1 }],
      [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
      2,
    );

    // No delete/remove call exists on this mock at all — if generateSchedule
    // ever tried to touch existing rows, this test would fail with "remove
    // is not a function" rather than silently passing.
    expect(repo.remove).toBeUndefined();
  });
});
