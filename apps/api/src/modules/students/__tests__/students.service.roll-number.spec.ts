import { StudentsService } from '../students.service';

/**
 * Covers roll_number auto-assignment — the one piece of business logic here
 * that isn't a straight passthrough to TypeORM. Roll numbers are never
 * accepted from a client (no DTO exposes the field), so this getRawOne-based
 * "next number" computation is the only thing standing between correct
 * sequential numbering and either gaps or collisions.
 */
describe('StudentsService roll number assignment', () => {
  function makeService(currentMax: number | null) {
    const repo: any = {
      findOne: jest.fn().mockResolvedValue(null), // no admission_number conflict
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: currentMax }),
      }),
    };
    const classesService: any = {}; // not exercised by these tests (no assignClass calls)
    return { service: new StudentsService(repo, classesService), repo };
  }

  it('assigns roll number 1 for the first student in a class', async () => {
    const { service } = makeService(null);
    const student = await service.create({
      tenant_id: 't1',
      campus_id: 'c1',
      admission_number: 'ADM-1',
      first_name: 'A',
      last_name: 'B',
      date_of_birth: '2015-01-01',
      grade_level: 'Grade 5',
      school_class_id: 'class-1',
      academic_year_id: 'y1',
      enrollment_date: '2026-06-01',
      guardian_name: 'G',
      guardian_phone: '123',
    } as any);
    expect(student.roll_number).toBe(1);
  });

  it('assigns the next sequential roll number when others already exist', async () => {
    const { service } = makeService(4);
    const student = await service.create({
      tenant_id: 't1',
      campus_id: 'c1',
      admission_number: 'ADM-2',
      first_name: 'C',
      last_name: 'D',
      date_of_birth: '2015-01-01',
      grade_level: 'Grade 5',
      school_class_id: 'class-1',
      academic_year_id: 'y1',
      enrollment_date: '2026-06-01',
      guardian_name: 'G',
      guardian_phone: '123',
    } as any);
    expect(student.roll_number).toBe(5);
  });

  it('leaves roll_number unset when no class is assigned yet', async () => {
    const { service } = makeService(null);
    const student = await service.create({
      tenant_id: 't1',
      campus_id: 'c1',
      admission_number: 'ADM-3',
      first_name: 'E',
      last_name: 'F',
      date_of_birth: '2015-01-01',
      grade_level: 'Grade 5',
      academic_year_id: 'y1',
      enrollment_date: '2026-06-01',
      guardian_name: 'G',
      guardian_phone: '123',
    } as any);
    expect(student.roll_number).toBeUndefined();
  });
});
