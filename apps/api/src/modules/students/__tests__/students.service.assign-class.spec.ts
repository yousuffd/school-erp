import { StudentsService } from '../students.service';

/**
 * Regression test for the bug where assigning a student to a class set
 * school_class_id but left the denormalized grade_level/section strings
 * unchanged — meaning a student could be linked to "Grade 5 - A" while still
 * displaying "Grade 2" everywhere that reads the plain string fields. This
 * was the direct cause of a real, confusing mismatch a user hit in testing.
 */
describe('StudentsService.assignClass', () => {
  it('syncs grade_level and section from the actual class being assigned', async () => {
    const student = {
      id: 'student-1',
      tenant_id: 'tenant-1',
      grade_level: 'Grade 2',
      section: undefined,
      school_class_id: undefined,
    };
    const repo: any = {
      findOne: jest.fn().mockResolvedValue(student),
      save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      }),
    };
    const classesService: any = {
      findOne: jest.fn().mockResolvedValue({
        id: 'class-1',
        grade_level: 'Grade 5',
        section: 'A',
      }),
    };

    const service = new StudentsService(repo, classesService);
    const result = await service.assignClass('student-1', { school_class_id: 'class-1' });

    expect(result.school_class_id).toBe('class-1');
    expect(result.grade_level).toBe('Grade 5');
    expect(result.section).toBe('A');
  });
});
