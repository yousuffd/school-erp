import 'reflect-metadata';
import dataSource from '../config/typeorm.config';
import { Tenant, TenantStatus } from '../modules/tenants/entities/tenant.entity';
import { Campus } from '../modules/campuses/entities/campus.entity';
import { AcademicYear } from '../modules/academic-years/entities/academic-year.entity';
import { Role, SystemRoleName } from '../modules/roles/entities/role.entity';
import { User, AuthProvider, UserStatus } from '../modules/users/entities/user.entity';
import { PHASE_0_ROLE_PERMISSIONS } from '../modules/roles/seed/phase0-permission-matrix';
import { SchoolClass } from '../modules/classes/entities/school-class.entity';
import { Subject } from '../modules/subjects/entities/subject.entity';
import { Student, StudentLifecycleStatus } from '../modules/students/entities/student.entity';
import { TimetableSlot, DayOfWeek } from '../modules/timetable/entities/timetable-slot.entity';
import { Exam } from '../modules/examinations/entities/exam.entity';
import { ExamResult } from '../modules/examinations/entities/exam-result.entity';
import { Book } from '../modules/library/entities/book.entity';
import { BookCopy, BookCopyStatus } from '../modules/library/entities/book-copy.entity';
import { BookIssue } from '../modules/library/entities/book-issue.entity';
import { Vehicle } from '../modules/transportation/entities/vehicle.entity';
import { Driver } from '../modules/transportation/entities/driver.entity';
import { Route } from '../modules/transportation/entities/route.entity';
import { RouteStop } from '../modules/transportation/entities/route-stop.entity';
import { RouteAssignment } from '../modules/transportation/entities/route-assignment.entity';
import { StudentTransportAssignment } from '../modules/transportation/entities/student-transport-assignment.entity';
import { StudentHealthProfile, BloodGroup } from '../modules/health-wellness/entities/student-health-profile.entity';
import { ImmunizationRecord } from '../modules/health-wellness/entities/immunization-record.entity';
import { ClinicVisit } from '../modules/health-wellness/entities/clinic-visit.entity';
import { MedicationAdministration } from '../modules/health-wellness/entities/medication-administration.entity';
import { ScreeningCampaign, ScreeningType } from '../modules/health-wellness/entities/screening-campaign.entity';
import { ScreeningResult } from '../modules/health-wellness/entities/screening-result.entity';
import { Item, ItemCategory } from '../modules/inventory-assets/entities/item.entity';
import { ItemStock } from '../modules/inventory-assets/entities/item-stock.entity';
import { StockTransaction, StockTransactionType } from '../modules/inventory-assets/entities/stock-transaction.entity';
import { AssetTag, AssetTagStatus } from '../modules/inventory-assets/entities/asset-tag.entity';
import { ProcurementRequest, ProcurementRequestStatus } from '../modules/inventory-assets/entities/procurement-request.entity';
import { MenuItem } from '../modules/cafeteria/entities/menu-item.entity';
import { DailyMenu, MealType } from '../modules/cafeteria/entities/daily-menu.entity';
import { DailyMenuItem } from '../modules/cafeteria/entities/daily-menu-item.entity';
import { MealAttendanceRecord } from '../modules/cafeteria/entities/meal-attendance-record.entity';
import { StudentDietaryRestriction, DietaryRestrictionType } from '../modules/cafeteria/entities/student-dietary-restriction.entity';
import * as bcrypt from 'bcryptjs';

/**
 * Seeds realistic placeholder data per Phase 0 kickoff §6:
 * 3 campuses, 2 academic years (one current), 5 system roles (+ Super Admin = 6),
 * 3 test users per role — so the dashboard shell isn't empty during dev.
 * Does NOT fabricate student/attendance/fee data — those entities don't exist
 * until Phase 1 (kickoff §6 explicit instruction).
 */
async function seed() {
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const campusRepo = dataSource.getRepository(Campus);
  const yearRepo = dataSource.getRepository(AcademicYear);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  let tenant = await tenantRepo.findOne({ where: { subdomain: 'demo' } });
  if (!tenant) {
    tenant = await tenantRepo.save(
      tenantRepo.create({
        school_name: 'Greenwood International School',
        subdomain: 'demo',
        primary_color: '#0D9488',
        status: TenantStatus.ACTIVE,
      }),
    );
  }

  const campusNames = ['Main Campus', 'North Campus', 'Riverside Campus'];
  for (const name of campusNames) {
    const exists = await campusRepo.findOne({ where: { tenant_id: tenant.id, name } });
    if (!exists) {
      await campusRepo.save(
        campusRepo.create({ tenant_id: tenant.id, name, timezone: 'Asia/Kolkata' }),
      );
    }
  }

  const years = [
    { label: '2024-25', start_date: '2024-06-01', end_date: '2025-04-30', is_current: false },
    { label: '2025-26', start_date: '2025-06-01', end_date: '2026-04-30', is_current: true },
  ];
  for (const y of years) {
    const exists = await yearRepo.findOne({ where: { tenant_id: tenant.id, label: y.label } });
    if (!exists) await yearRepo.save(yearRepo.create({ tenant_id: tenant.id, ...y }));
  }

  const roleEntities: Role[] = [];
  for (const name of Object.values(SystemRoleName)) {
    const tenantId = name === SystemRoleName.SUPER_ADMIN ? null : tenant.id;
    let role = await roleRepo.findOne({ where: { tenant_id: tenantId as any, name } });
    if (!role) {
      role = await roleRepo.save(
        roleRepo.create({
          tenant_id: tenantId,
          name,
          is_system_role: true,
          permissions: PHASE_0_ROLE_PERMISSIONS[name],
        }),
      );
    }
    roleEntities.push(role);
  }

  const passwordHash = await bcrypt.hash('Password123!', 12);
  for (const role of roleEntities) {
    if (role.name === SystemRoleName.SUPER_ADMIN) continue; // platform-level, not tenant test users
    for (let i = 1; i <= 3; i++) {
      const email = `${role.name.toLowerCase().replace(/[^a-z]+/g, '.')}${i}@demo.schoolerp.test`;
      const exists = await userRepo.findOne({ where: { tenant_id: tenant.id, email } });
      if (!exists) {
        await userRepo.save(
          userRepo.create({
            tenant_id: tenant.id,
            role_id: role.id,
            name: `${role.name} Test User ${i}`,
            email,
            auth_provider: AuthProvider.LOCAL,
            password_hash: passwordHash,
            status: UserStatus.ACTIVE,
          }),
        );
      }
    }
  }

  // ---------------------------------------------------------------------
  // Phase 1/2 test data — classes, subjects, students, timetable
  // assignments, and exams/results, layered on top of the Phase 0 seed
  // above. Every insert is guarded by an existence check (same convention
  // as above), so re-running this script is safe and won't duplicate rows.
  //
  // Built specifically to exercise Examinations' Teacher class-scoping
  // (added this session):
  //   - teacher1 is assigned (via TimetableSlot) to Grade 6 - A only
  //   - teacher3 is assigned to Grade 7 - A only
  //   - teacher2 has NO timetable assignments at all — should see every
  //     class unscoped, per the documented "no assignments = unscoped"
  //     fallback used throughout this session's scoping work
  //   - student1 (an existing seeded Student-role login) is linked via
  //     User.student_id to a real Student record in Grade 6 - A, so the
  //     Student self-service "My Results" / report-card view is testable
  //
  // Note: this script writes directly via TypeORM repositories, the same
  // way the Phase 0 seed above does — it does NOT go through
  // ExamsService/TimetableService, so the ownership checks added to those
  // services this session don't apply here. That's intentional (seed data
  // is trusted input), not a gap in the enforcement itself.
  // ---------------------------------------------------------------------

  const classRepo = dataSource.getRepository(SchoolClass);
  const subjectRepo = dataSource.getRepository(Subject);
  const studentRepo = dataSource.getRepository(Student);
  const slotRepo = dataSource.getRepository(TimetableSlot);
  const examRepo = dataSource.getRepository(Exam);
  const resultRepo = dataSource.getRepository(ExamResult);

  const mainCampus = await campusRepo.findOneOrFail({ where: { tenant_id: tenant.id, name: 'Main Campus' } });
  const currentYear = await yearRepo.findOneOrFail({ where: { tenant_id: tenant.id, is_current: true } });

  // --- Classes ---
  const classDefs = [
    { grade_level: 'Grade 6', section: 'A' },
    { grade_level: 'Grade 6', section: 'B' },
    { grade_level: 'Grade 7', section: 'A' },
  ];
  const classes: Record<string, SchoolClass> = {};
  for (const c of classDefs) {
    const key = `${c.grade_level} - ${c.section}`;
    let cls = await classRepo.findOne({
      where: {
        tenant_id: tenant.id,
        academic_year_id: currentYear.id,
        grade_level: c.grade_level,
        section: c.section,
      },
    });
    if (!cls) {
      cls = await classRepo.save(
        classRepo.create({
          tenant_id: tenant.id,
          campus_id: mainCampus.id,
          academic_year_id: currentYear.id,
          grade_level: c.grade_level,
          section: c.section,
        }),
      );
    }
    classes[key] = cls;
  }

  // --- Subjects ---
  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SST' },
  ];
  const subjects: Record<string, Subject> = {};
  for (const s of subjectDefs) {
    let subject = await subjectRepo.findOne({ where: { tenant_id: tenant.id, code: s.code } });
    if (!subject) {
      subject = await subjectRepo.save(subjectRepo.create({ tenant_id: tenant.id, name: s.name, code: s.code }));
    }
    subjects[s.code] = subject;
  }

  // --- Students ---
  const studentDefs = [
    { class: 'Grade 6 - A', roll: 1, first: 'Aarav', last: 'Sharma', dob: '2014-03-12', guardian: 'Rohit Sharma', phone: '9876500001' },
    { class: 'Grade 6 - A', roll: 2, first: 'Diya', last: 'Patel', dob: '2014-06-20', guardian: 'Nilesh Patel', phone: '9876500002' },
    { class: 'Grade 6 - A', roll: 3, first: 'Ishaan', last: 'Reddy', dob: '2014-01-08', guardian: 'Kavita Reddy', phone: '9876500003' },
    { class: 'Grade 6 - A', roll: 4, first: 'Myra', last: 'Nair', dob: '2014-09-30', guardian: 'Suresh Nair', phone: '9876500004' },
    { class: 'Grade 6 - B', roll: 1, first: 'Vihaan', last: 'Iyer', dob: '2014-04-15', guardian: 'Ganesh Iyer', phone: '9876500005' },
    { class: 'Grade 6 - B', roll: 2, first: 'Anaya', last: 'Joshi', dob: '2014-11-02', guardian: 'Meera Joshi', phone: '9876500006' },
    { class: 'Grade 6 - B', roll: 3, first: 'Kabir', last: 'Verma', dob: '2014-07-19', guardian: 'Arjun Verma', phone: '9876500007' },
    { class: 'Grade 7 - A', roll: 1, first: 'Sara', last: 'Khan', dob: '2013-02-25', guardian: 'Imran Khan', phone: '9876500008' },
    { class: 'Grade 7 - A', roll: 2, first: 'Advait', last: 'Kulkarni', dob: '2013-05-11', guardian: 'Priya Kulkarni', phone: '9876500009' },
    { class: 'Grade 7 - A', roll: 3, first: 'Zara', last: 'Sheikh', dob: '2013-10-04', guardian: 'Fatima Sheikh', phone: '9876500010' },
  ];
  const students: Record<string, Student> = {}; // key: "<class> - <roll>"
  let admissionCounter = 1001;
  for (const s of studentDefs) {
    const cls = classes[s.class];
    const key = `${s.class}-${s.roll}`;
    let student = await studentRepo.findOne({
      where: { tenant_id: tenant.id, school_class_id: cls.id, roll_number: s.roll },
    });
    if (!student) {
      student = await studentRepo.save(
        studentRepo.create({
          tenant_id: tenant.id,
          campus_id: mainCampus.id,
          admission_number: `ADM-2025-${admissionCounter}`,
          first_name: s.first,
          last_name: s.last,
          date_of_birth: s.dob,
          grade_level: cls.grade_level,
          section: cls.section,
          school_class_id: cls.id,
          roll_number: s.roll,
          academic_year_id: currentYear.id,
          status: StudentLifecycleStatus.ACTIVE,
          enrollment_date: '2025-06-01',
          guardian_name: s.guardian,
          guardian_phone: s.phone,
        }),
      );
    }
    admissionCounter += 1;
    students[key] = student;
  }

  // --- Teachers (reuse the Phase 0 seeded Teacher-role users above) ---
  const teacher1 = await userRepo.findOneOrFail({ where: { tenant_id: tenant.id, email: 'teacher1@demo.schoolerp.test' } });
  const teacher2 = await userRepo.findOneOrFail({ where: { tenant_id: tenant.id, email: 'teacher2@demo.schoolerp.test' } });
  const teacher3 = await userRepo.findOneOrFail({ where: { tenant_id: tenant.id, email: 'teacher3@demo.schoolerp.test' } });
  // teacher2 deliberately gets NO timetable slots below — the "unscoped" case.

  // --- Timetable assignments ---
  async function ensureSlot(schoolClassId: string, subjectId: string, teacherId: string, day: DayOfWeek, period: number) {
    const exists = await slotRepo.findOne({
      where: { tenant_id: tenant!.id, school_class_id: schoolClassId, day_of_week: day, period_number: period },
    });
    if (!exists) {
      await slotRepo.save(
        slotRepo.create({
          tenant_id: tenant!.id,
          school_class_id: schoolClassId,
          subject_id: subjectId,
          teacher_id: teacherId,
          day_of_week: day,
          period_number: period,
        }),
      );
    }
  }
  await ensureSlot(classes['Grade 6 - A'].id, subjects['MATH'].id, teacher1.id, DayOfWeek.MONDAY, 1);
  await ensureSlot(classes['Grade 6 - A'].id, subjects['ENG'].id, teacher1.id, DayOfWeek.MONDAY, 2);
  await ensureSlot(classes['Grade 7 - A'].id, subjects['SCI'].id, teacher3.id, DayOfWeek.TUESDAY, 1);

  // --- Exams ---
  async function ensureExam(
    schoolClassId: string,
    subjectId: string,
    name: string,
    examDate: string,
    maxMarks: string,
    createdBy: string,
  ): Promise<Exam> {
    let exam = await examRepo.findOne({
      where: { tenant_id: tenant!.id, school_class_id: schoolClassId, subject_id: subjectId, name },
    });
    if (!exam) {
      exam = await examRepo.save(
        examRepo.create({
          tenant_id: tenant!.id,
          school_class_id: schoolClassId,
          subject_id: subjectId,
          academic_year_id: currentYear.id,
          name,
          exam_date: examDate,
          max_marks: maxMarks,
          created_by: createdBy,
        }),
      );
    }
    return exam;
  }

  const examMathA = await ensureExam(classes['Grade 6 - A'].id, subjects['MATH'].id, 'Mid-Term Exam', '2025-09-15', '100.00', teacher1.id);
  const examEngA = await ensureExam(classes['Grade 6 - A'].id, subjects['ENG'].id, 'Mid-Term Exam', '2025-09-16', '100.00', teacher1.id);
  const examMathB = await ensureExam(classes['Grade 6 - B'].id, subjects['MATH'].id, 'Unit Test 1', '2025-08-20', '50.00', teacher2.id);
  const examSciC = await ensureExam(classes['Grade 7 - A'].id, subjects['SCI'].id, 'Mid-Term Exam', '2025-09-18', '100.00', teacher3.id);

  // --- Exam Results — a mix of real scores, plus one deliberate "Absent" (null) ---
  async function ensureResult(examId: string, studentId: string, marks: string | null, enteredBy: string) {
    const exists = await resultRepo.findOne({ where: { tenant_id: tenant!.id, exam_id: examId, student_id: studentId } });
    if (!exists) {
      await resultRepo.save(
        resultRepo.create({
          tenant_id: tenant!.id,
          exam_id: examId,
          student_id: studentId,
          marks_obtained: marks ?? undefined,
          entered_by: enteredBy,
        }),
      );
    }
  }
  await ensureResult(examMathA.id, students['Grade 6 - A-1'].id, '88.00', teacher1.id);
  await ensureResult(examMathA.id, students['Grade 6 - A-2'].id, '76.50', teacher1.id);
  await ensureResult(examMathA.id, students['Grade 6 - A-3'].id, null, teacher1.id); // Absent
  await ensureResult(examMathA.id, students['Grade 6 - A-4'].id, '91.00', teacher1.id);
  await ensureResult(examEngA.id, students['Grade 6 - A-1'].id, '82.00', teacher1.id);
  await ensureResult(examEngA.id, students['Grade 6 - A-2'].id, '79.00', teacher1.id);
  await ensureResult(examMathB.id, students['Grade 6 - B-1'].id, '40.00', teacher2.id);
  await ensureResult(examMathB.id, students['Grade 6 - B-2'].id, '35.50', teacher2.id);
  await ensureResult(examSciC.id, students['Grade 7 - A-1'].id, '85.00', teacher3.id);
  await ensureResult(examSciC.id, students['Grade 7 - A-2'].id, '77.00', teacher3.id);

  // --- Link one existing seeded Student-role login to a real Student record ---
  const studentLoginUser = await userRepo.findOneOrFail({
    where: { tenant_id: tenant.id, email: 'student1@demo.schoolerp.test' },
  });
  if (!studentLoginUser.student_id) {
    studentLoginUser.student_id = students['Grade 6 - A-1'].id;
    await userRepo.save(studentLoginUser);
  }

  // ---------------------------------------------------------------------
  // Phase 3 test data — Library (Blueprint Part 2, Module 12). Layered on
  // top of everything above, same existence-checked/idempotent convention.
  // Matches on (tenant_id, title, author) rather than erroring/duplicating
  // if a book already exists — e.g. "The Hobbit" was created manually via
  // curl during Phase 3 backend testing; this just tops it up with more
  // copies rather than conflicting with it.
  //
  // One deliberately overdue issue (a Harry Potter copy, out to Aarav
  // Sharma with a due_date well in the past) so the Library dashboard/UI
  // has a real non-empty "overdue" state to render during frontend dev,
  // without a human manually creating one after every DB reset.
  // ---------------------------------------------------------------------

  const bookRepo = dataSource.getRepository(Book);
  const bookCopyRepo = dataSource.getRepository(BookCopy);
  const bookIssueRepo = dataSource.getRepository(BookIssue);

  const schoolAdmin1 = await userRepo.findOneOrFail({
    where: { tenant_id: tenant.id, email: 'school.admin1@demo.schoolerp.test' },
  });

  const bookDefs = [
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fiction', copies: 2 },
    { title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', category: 'Fantasy', copies: 2 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', copies: 2 },
    { title: "Charlotte's Web", author: 'E.B. White', category: 'Fiction', copies: 1 },
    { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Non-Fiction', copies: 1 },
  ];

  const books: Record<string, Book> = {};
  let barcodeCounter = 1001;
  for (const b of bookDefs) {
    let book = await bookRepo.findOne({ where: { tenant_id: tenant.id, title: b.title, author: b.author } });
    if (!book) {
      book = await bookRepo.save(
        bookRepo.create({ tenant_id: tenant.id, title: b.title, author: b.author, category: b.category }),
      );
    }
    books[b.title] = book;

    const existingCopies = await bookCopyRepo.count({ where: { tenant_id: tenant.id, book_id: book.id } });
    const copiesToAdd = b.copies - existingCopies;
    for (let i = 0; i < copiesToAdd; i++) {
      // Skip ahead past any barcode already in use (e.g. LIB-0001 from
      // manual curl testing) rather than colliding with it.
      let barcode = `LIB-${barcodeCounter}`;
      barcodeCounter += 1;
      // eslint-disable-next-line no-await-in-loop
      let clash = await bookCopyRepo.findOne({ where: { tenant_id: tenant.id, barcode } });
      while (clash) {
        barcode = `LIB-${barcodeCounter}`;
        barcodeCounter += 1;
        // eslint-disable-next-line no-await-in-loop
        clash = await bookCopyRepo.findOne({ where: { tenant_id: tenant.id, barcode } });
      }
      await bookCopyRepo.save(
        bookCopyRepo.create({ tenant_id: tenant.id, book_id: book.id, campus_id: mainCampus.id, barcode }),
      );
    }
  }

  // --- One deliberately overdue issue ---
  const harryPotterCopy = await bookCopyRepo.findOne({
    where: {
      tenant_id: tenant.id,
      book_id: books["Harry Potter and the Sorcerer's Stone"].id,
      status: BookCopyStatus.AVAILABLE,
    },
  });
  if (harryPotterCopy) {
    const openIssueExists = await bookIssueRepo
      .createQueryBuilder('issue')
      .where('issue.book_copy_id = :copyId', { copyId: harryPotterCopy.id })
      .andWhere('issue.return_date IS NULL')
      .getOne();

    if (!openIssueExists) {
      await bookIssueRepo.save(
        bookIssueRepo.create({
          tenant_id: tenant.id,
          book_copy_id: harryPotterCopy.id,
          student_id: students['Grade 6 - A-1'].id, // Aarav Sharma
          issued_by: schoolAdmin1.id,
          issue_date: '2025-06-15',
          due_date: '2025-06-29', // deliberately well in the past — always overdue
        }),
      );
      harryPotterCopy.status = BookCopyStatus.ISSUED;
      await bookCopyRepo.save(harryPotterCopy);
    }
  }

  // ---------------------------------------------------------------------
  // Phase 3 test data — Transportation (Blueprint Part 2, Module 13).
  // Layered on top of everything above, same existence-checked/idempotent
  // convention. 2 vehicles, 2 drivers, 2 routes (3 stops + 2 stops), one
  // route assignment per route for the current academic year, and two
  // student transport assignments — including Aarav Sharma, the same
  // demo student already used for Examinations/Library, so a single
  // student login has real data across every module for frontend dev.
  // ---------------------------------------------------------------------

  const vehicleRepo = dataSource.getRepository(Vehicle);
  const driverRepo = dataSource.getRepository(Driver);
  const routeRepo = dataSource.getRepository(Route);
  const routeStopRepo = dataSource.getRepository(RouteStop);
  const routeAssignmentRepo = dataSource.getRepository(RouteAssignment);
  const studentTransportRepo = dataSource.getRepository(StudentTransportAssignment);

  const vehicleDefs = [
    { registration_number: 'KA-01-AB-1234', model: 'Tata Starbus', capacity: 40 },
    { registration_number: 'KA-01-CD-5678', model: 'Ashok Leyland Falcon', capacity: 35 },
  ];
  const vehicles: Record<string, Vehicle> = {};
  for (const v of vehicleDefs) {
    let vehicle = await vehicleRepo.findOne({ where: { tenant_id: tenant.id, registration_number: v.registration_number } });
    if (!vehicle) {
      vehicle = await vehicleRepo.save(
        vehicleRepo.create({ tenant_id: tenant.id, campus_id: mainCampus.id, ...v }),
      );
    }
    vehicles[v.registration_number] = vehicle;
  }

  const driverDefs = [
    { name: 'Ramesh Gowda', license_number: 'DL-KA-2020-001', phone: '9876600001' },
    { name: 'Suresh Babu', license_number: 'DL-KA-2019-002', phone: '9876600002' },
  ];
  const drivers: Record<string, Driver> = {};
  for (const d of driverDefs) {
    let driver = await driverRepo.findOne({ where: { tenant_id: tenant.id, license_number: d.license_number } });
    if (!driver) {
      driver = await driverRepo.save(driverRepo.create({ tenant_id: tenant.id, ...d }));
    }
    drivers[d.license_number] = driver;
  }

  const routeDefs = [
    {
      name: 'North Loop',
      description: 'Covers the northern residential blocks',
      stops: ['Green Park Gate', 'Lakeview Apartments', 'Cross Junction'],
    },
    {
      name: 'South Loop',
      description: 'Covers the southern residential blocks',
      stops: ['Market Circle', 'Riverside Colony'],
    },
  ];
  const routes: Record<string, Route> = {};
  const routeStops: Record<string, RouteStop[]> = {};
  for (const r of routeDefs) {
    let route = await routeRepo.findOne({ where: { tenant_id: tenant.id, name: r.name } });
    if (!route) {
      route = await routeRepo.save(routeRepo.create({ tenant_id: tenant.id, name: r.name, description: r.description }));
    }
    routes[r.name] = route;

    const stops: RouteStop[] = [];
    for (let i = 0; i < r.stops.length; i++) {
      const sequence_order = i + 1;
      let stop = await routeStopRepo.findOne({
        where: { tenant_id: tenant.id, route_id: route.id, sequence_order },
      });
      if (!stop) {
        stop = await routeStopRepo.save(
          routeStopRepo.create({
            tenant_id: tenant.id,
            route_id: route.id,
            name: r.stops[i],
            sequence_order,
          }),
        );
      }
      stops.push(stop);
    }
    routeStops[r.name] = stops;
  }

  // --- Route assignments (one vehicle+driver per route, current year) ---
  async function ensureRouteAssignment(routeName: string, vehicleReg: string, licenseNumber: string) {
    const route = routes[routeName];
    const exists = await routeAssignmentRepo.findOne({
      where: { tenant_id: tenant!.id, route_id: route.id, academic_year_id: currentYear.id },
    });
    if (!exists) {
      await routeAssignmentRepo.save(
        routeAssignmentRepo.create({
          tenant_id: tenant!.id,
          route_id: route.id,
          vehicle_id: vehicles[vehicleReg].id,
          driver_id: drivers[licenseNumber].id,
          academic_year_id: currentYear.id,
        }),
      );
    }
  }
  await ensureRouteAssignment('North Loop', 'KA-01-AB-1234', 'DL-KA-2020-001');
  await ensureRouteAssignment('South Loop', 'KA-01-CD-5678', 'DL-KA-2019-002');

  // --- Student transport assignments ---
  async function ensureStudentTransportAssignment(studentKey: string, routeName: string, stopIndex: number) {
    const student = students[studentKey];
    const route = routes[routeName];
    const stop = routeStops[routeName][stopIndex];
    const exists = await studentTransportRepo.findOne({
      where: { tenant_id: tenant!.id, student_id: student.id, academic_year_id: currentYear.id },
    });
    if (!exists) {
      await studentTransportRepo.save(
        studentTransportRepo.create({
          tenant_id: tenant!.id,
          student_id: student.id,
          route_id: route.id,
          stop_id: stop.id,
          academic_year_id: currentYear.id,
        }),
      );
    }
  }
  await ensureStudentTransportAssignment('Grade 6 - A-1', 'North Loop', 0); // Aarav Sharma -> Green Park Gate
  await ensureStudentTransportAssignment('Grade 6 - A-2', 'North Loop', 1); // Diya Patel -> Lakeview Apartments
  await ensureStudentTransportAssignment('Grade 7 - A-1', 'South Loop', 0); // Sara Khan -> Market Circle

  // ---------------------------------------------------------------------
  // Phase 3 test data — Health & Wellness (Blueprint Part 2, Module 16).
  // Layered on top of everything above, same existence-checked/idempotent
  // convention.
  //
  // Deliberately spread across three different classes so Teacher
  // class-scoping is actually testable, not just implemented:
  //   - Aarav Sharma & Diya Patel (Grade 6 - A) — teacher1's scope
  //   - Sara Khan (Grade 7 - A) — teacher3's scope, should be INVISIBLE
  //     to teacher1
  //   - Vihaan Iyer (Grade 6 - B) — no teacher has timetable assignments
  //     here, should also be invisible to both teacher1 and teacher3
  //     (both of whom ARE scoped, unlike teacher2)
  // ---------------------------------------------------------------------

  const healthProfileRepo = dataSource.getRepository(StudentHealthProfile);
  const immunizationRepo = dataSource.getRepository(ImmunizationRecord);
  const clinicVisitRepo = dataSource.getRepository(ClinicVisit);
  const medicationRepo = dataSource.getRepository(MedicationAdministration);
  const screeningCampaignRepo = dataSource.getRepository(ScreeningCampaign);
  const screeningResultRepo = dataSource.getRepository(ScreeningResult);

  async function ensureHealthProfile(
    studentKey: string,
    bloodGroup: BloodGroup,
    allergies: string | undefined,
    chronicConditions: string | undefined,
  ) {
    const student = students[studentKey];
    const exists = await healthProfileRepo.findOne({ where: { tenant_id: tenant!.id, student_id: student.id } });
    if (!exists) {
      await healthProfileRepo.save(
        healthProfileRepo.create({
          tenant_id: tenant!.id,
          student_id: student.id,
          blood_group: bloodGroup,
          allergies,
          chronic_conditions: chronicConditions,
          updated_by: schoolAdmin1.id,
        }),
      );
    }
  }
  await ensureHealthProfile('Grade 6 - A-1', BloodGroup.O_POSITIVE, 'Peanuts', undefined); // Aarav Sharma
  await ensureHealthProfile('Grade 6 - A-2', BloodGroup.A_POSITIVE, undefined, 'Mild asthma'); // Diya Patel
  await ensureHealthProfile('Grade 7 - A-1', BloodGroup.B_POSITIVE, 'Penicillin', undefined); // Sara Khan
  await ensureHealthProfile('Grade 6 - B-1', BloodGroup.UNKNOWN, undefined, undefined); // Vihaan Iyer

  const aarav = students['Grade 6 - A-1'];
  const existingImmunization = await immunizationRepo.findOne({
    where: { tenant_id: tenant.id, student_id: aarav.id, vaccine_name: 'Tdap Booster' },
  });
  if (!existingImmunization) {
    await immunizationRepo.save(
      immunizationRepo.create({
        tenant_id: tenant.id,
        student_id: aarav.id,
        vaccine_name: 'Tdap Booster',
        date_administered: '2025-08-01',
        recorded_by: schoolAdmin1.id,
      }),
    );
  }

  const existingVisit = await clinicVisitRepo.findOne({
    where: { tenant_id: tenant.id, student_id: aarav.id, reason: 'Scraped knee at recess' },
  });
  if (!existingVisit) {
    await clinicVisitRepo.save(
      clinicVisitRepo.create({
        tenant_id: tenant.id,
        student_id: aarav.id,
        visit_date: new Date('2026-06-20T11:15:00Z'),
        reason: 'Scraped knee at recess',
        treatment_given: 'Cleaned and bandaged',
        follow_up_required: false,
        recorded_by: schoolAdmin1.id,
      }),
    );
  }

  const diya = students['Grade 6 - A-2'];
  const existingMedication = await medicationRepo.findOne({
    where: { tenant_id: tenant.id, student_id: diya.id, medication_name: 'Salbutamol Inhaler' },
  });
  if (!existingMedication) {
    await medicationRepo.save(
      medicationRepo.create({
        tenant_id: tenant.id,
        student_id: diya.id,
        medication_name: 'Salbutamol Inhaler',
        dosage: '2 puffs',
        administered_at: new Date('2026-06-25T09:30:00Z'),
        administered_by: schoolAdmin1.id,
        consent_confirmed: true,
      }),
    );
  }

  let visionCampaign = await screeningCampaignRepo.findOne({
    where: { tenant_id: tenant.id, name: 'Vision Screening 2026' },
  });
  if (!visionCampaign) {
    visionCampaign = await screeningCampaignRepo.save(
      screeningCampaignRepo.create({
        tenant_id: tenant.id,
        name: 'Vision Screening 2026',
        screening_type: ScreeningType.VISION,
        campaign_date: '2026-07-01',
        description: 'Annual school-wide vision screening',
      }),
    );
  }

  async function ensureScreeningResult(studentKey: string, summary: string, flagged: boolean) {
    const student = students[studentKey];
    const exists = await screeningResultRepo.findOne({
      where: { tenant_id: tenant!.id, campaign_id: visionCampaign!.id, student_id: student.id },
    });
    if (!exists) {
      await screeningResultRepo.save(
        screeningResultRepo.create({
          tenant_id: tenant!.id,
          campaign_id: visionCampaign!.id,
          student_id: student.id,
          result_summary: summary,
          flagged_for_followup: flagged,
          recorded_by: schoolAdmin1.id,
        }),
      );
    }
  }
  await ensureScreeningResult('Grade 6 - A-1', '20/20 both eyes', false); // Aarav Sharma
  await ensureScreeningResult('Grade 7 - A-1', 'Mild myopia, left eye', true); // Sara Khan

  // ---------------------------------------------------------------------
  // Phase 3 test data — Inventory & Assets (Blueprint Part 2, Module 15).
  // Layered on top of everything above, same existence-checked/idempotent
  // convention.
  //
  // Deliberately named distinctly from anything a user might create
  // manually while testing (e.g. NOT "A4 Paper") to avoid this seed
  // silently attaching its own stock/tags to a user's own test item of
  // the same name.
  //
  // Writes ItemStock directly alongside StockTransaction (same as
  // recordTransaction() would derive) since this script bypasses
  // StockService entirely, same convention as every other seed block —
  // trusted input, not routed through the service layer.
  // ---------------------------------------------------------------------

  const itemRepo = dataSource.getRepository(Item);
  const itemStockRepo = dataSource.getRepository(ItemStock);
  const stockTransactionRepo = dataSource.getRepository(StockTransaction);
  const assetTagRepo = dataSource.getRepository(AssetTag);
  const procurementRequestRepo = dataSource.getRepository(ProcurementRequest);

  async function ensureItem(
    name: string,
    category: ItemCategory,
    unit: string,
    isTrackableAsset: boolean,
    reorderPoint?: number,
  ): Promise<Item> {
    let item = await itemRepo.findOne({ where: { tenant_id: tenant!.id, name } });
    if (!item) {
      item = await itemRepo.save(
        itemRepo.create({
          tenant_id: tenant!.id,
          name,
          category,
          unit,
          is_trackable_asset: isTrackableAsset,
          reorder_point: reorderPoint,
        }),
      );
    }
    return item;
  }

  const a4Paper = await ensureItem('A4 Copy Paper', ItemCategory.STATIONERY, 'ream', false, 20);
  const markers = await ensureItem('Whiteboard Markers', ItemCategory.STATIONERY, 'box', false, 10);
  const microscope = await ensureItem('Digital Microscope', ItemCategory.LAB_EQUIPMENT, 'pcs', true);
  const chair = await ensureItem('Student Desk Chair', ItemCategory.FURNITURE, 'pcs', true);

  async function ensureStockTransaction(
    item: Item,
    type: StockTransactionType,
    quantity: number,
    date: string,
  ) {
    const exists = await stockTransactionRepo.findOne({
      where: { tenant_id: tenant!.id, item_id: item.id, transaction_type: type, transaction_date: date },
    });
    if (exists) return;

    let stock = await itemStockRepo.findOne({
      where: { tenant_id: tenant!.id, item_id: item.id, campus_id: mainCampus.id },
    });
    if (!stock) {
      stock = itemStockRepo.create({
        tenant_id: tenant!.id,
        item_id: item.id,
        campus_id: mainCampus.id,
        quantity_on_hand: 0,
      });
    }
    if (type === StockTransactionType.RECEIVED) stock.quantity_on_hand += quantity;
    else if (type === StockTransactionType.ISSUED) stock.quantity_on_hand -= quantity;
    else stock.quantity_on_hand = quantity; // ADJUSTED — absolute count
    await itemStockRepo.save(stock);

    await stockTransactionRepo.save(
      stockTransactionRepo.create({
        tenant_id: tenant!.id,
        item_id: item.id,
        campus_id: mainCampus.id,
        transaction_type: type,
        quantity,
        transaction_date: date,
        recorded_by: schoolAdmin1.id,
      }),
    );
  }

  await ensureStockTransaction(a4Paper, StockTransactionType.RECEIVED, 50, '2026-06-01'); // -> 50, above reorder_point 20
  await ensureStockTransaction(markers, StockTransactionType.RECEIVED, 12, '2026-06-01');
  await ensureStockTransaction(markers, StockTransactionType.ISSUED, 5, '2026-06-15'); // -> 7, below reorder_point 10 (deliberate)

  async function ensureAssetTag(
    item: Item,
    tagNumber: string,
    status: AssetTagStatus,
    location: string,
    purchaseDate: string,
    purchaseCost: string,
  ) {
    const exists = await assetTagRepo.findOne({ where: { tenant_id: tenant!.id, asset_tag_number: tagNumber } });
    if (!exists) {
      await assetTagRepo.save(
        assetTagRepo.create({
          tenant_id: tenant!.id,
          item_id: item.id,
          campus_id: mainCampus.id,
          asset_tag_number: tagNumber,
          status,
          assigned_location: location,
          purchase_date: purchaseDate,
          purchase_cost: purchaseCost,
        }),
      );
    }
  }
  await ensureAssetTag(microscope, 'INV-1001', AssetTagStatus.IN_USE, 'Lab 2', '2025-08-01', '45000.00');
  await ensureAssetTag(microscope, 'INV-1002', AssetTagStatus.IN_USE, 'Lab 2', '2025-08-01', '45000.00');
  await ensureAssetTag(chair, 'INV-2001', AssetTagStatus.UNDER_REPAIR, 'Staff Room', '2024-01-15', '3500.00');

  async function ensureProcurementRequest(
    item: Item,
    quantity: number,
    requestedDate: string,
    status: ProcurementRequestStatus,
    approvalDate?: string,
  ) {
    const exists = await procurementRequestRepo.findOne({
      where: { tenant_id: tenant!.id, item_id: item.id, requested_date: requestedDate },
    });
    if (!exists) {
      await procurementRequestRepo.save(
        procurementRequestRepo.create({
          tenant_id: tenant!.id,
          item_id: item.id,
          campus_id: mainCampus.id,
          requested_by: schoolAdmin1.id,
          quantity_requested: quantity,
          status,
          requested_date: requestedDate,
          approved_by: status !== ProcurementRequestStatus.PENDING ? schoolAdmin1.id : undefined,
          approval_date: approvalDate,
        }),
      );
    }
  }
  await ensureProcurementRequest(markers, 10, '2026-07-01', ProcurementRequestStatus.PENDING);
  await ensureProcurementRequest(microscope, 1, '2026-06-20', ProcurementRequestStatus.APPROVED, '2026-06-22');

  // ---------------------------------------------------------------------
  // Phase 3 test data — Cafeteria & Meal Management (Blueprint Part 2,
  // Module 22). Layered on top of everything above, same
  // existence-checked/idempotent convention.
  //
  // Uses a fixed date (2026-07-06) rather than "today" — deliberately, so
  // this seed never collides with whatever date a human happens to be
  // running manual curl/test-api.sh testing against on the day they run
  // this script. Existence-checked on (tenant_id, menu_date, meal_type)
  // regardless, so it's safe even if that date does happen to coincide.
  // ---------------------------------------------------------------------

  const menuItemRepo = dataSource.getRepository(MenuItem);
  const dailyMenuRepo = dataSource.getRepository(DailyMenu);
  const dailyMenuItemRepo = dataSource.getRepository(DailyMenuItem);
  const mealAttendanceRepo = dataSource.getRepository(MealAttendanceRecord);
  const dietaryRestrictionRepo = dataSource.getRepository(StudentDietaryRestriction);

  async function ensureMenuItem(name: string, description: string, dietaryTags?: string): Promise<MenuItem> {
    let item = await menuItemRepo.findOne({ where: { tenant_id: tenant!.id, name } });
    if (!item) {
      item = await menuItemRepo.save(
        menuItemRepo.create({ tenant_id: tenant!.id, name, description, dietary_tags: dietaryTags }),
      );
    }
    return item;
  }

  const rice = await ensureMenuItem('Steamed Rice', 'Plain steamed white rice', 'vegetarian, vegan, gluten_free');
  const dal = await ensureMenuItem('Dal Tadka', 'Yellow lentils tempered with cumin and garlic', 'vegetarian, vegan');
  const vegCurry = await ensureMenuItem('Mixed Vegetable Curry', 'Seasonal vegetables in a light gravy', 'vegetarian, vegan');
  const chapati = await ensureMenuItem('Chapati', 'Whole wheat flatbread', 'vegetarian, vegan');
  const fruitSalad = await ensureMenuItem('Fruit Salad', 'Seasonal fresh fruit', 'vegetarian, vegan, gluten_free');

  const SEED_MENU_DATE = '2026-07-06';
  let lunchMenu = await dailyMenuRepo.findOne({
    where: { tenant_id: tenant.id, menu_date: SEED_MENU_DATE, meal_type: MealType.LUNCH },
  });
  if (!lunchMenu) {
    lunchMenu = await dailyMenuRepo.save(
      dailyMenuRepo.create({ tenant_id: tenant.id, menu_date: SEED_MENU_DATE, meal_type: MealType.LUNCH }),
    );
  }

  async function ensureDailyMenuItem(menuItem: MenuItem) {
    const exists = await dailyMenuItemRepo.findOne({
      where: { tenant_id: tenant!.id, daily_menu_id: lunchMenu!.id, menu_item_id: menuItem.id },
    });
    if (!exists) {
      await dailyMenuItemRepo.save(
        dailyMenuItemRepo.create({ tenant_id: tenant!.id, daily_menu_id: lunchMenu!.id, menu_item_id: menuItem.id }),
      );
    }
  }
  await ensureDailyMenuItem(rice);
  await ensureDailyMenuItem(dal);
  await ensureDailyMenuItem(vegCurry);
  await ensureDailyMenuItem(chapati);
  await ensureDailyMenuItem(fruitSalad);

  async function ensureMealAttendance(studentKey: string) {
    const student = students[studentKey];
    const exists = await mealAttendanceRepo.findOne({
      where: {
        tenant_id: tenant!.id,
        student_id: student.id,
        attendance_date: SEED_MENU_DATE,
        meal_type: MealType.LUNCH,
      },
    });
    if (!exists) {
      await mealAttendanceRepo.save(
        mealAttendanceRepo.create({
          tenant_id: tenant!.id,
          student_id: student.id,
          attendance_date: SEED_MENU_DATE,
          meal_type: MealType.LUNCH,
          recorded_by: schoolAdmin1.id,
        }),
      );
    }
  }
  await ensureMealAttendance('Grade 6 - A-1'); // Aarav Sharma
  await ensureMealAttendance('Grade 6 - A-2'); // Diya Patel
  await ensureMealAttendance('Grade 7 - A-1'); // Sara Khan

  async function ensureDietaryRestriction(studentKey: string, type: DietaryRestrictionType, details: string) {
    const student = students[studentKey];
    const exists = await dietaryRestrictionRepo.findOne({
      where: { tenant_id: tenant!.id, student_id: student.id, restriction_type: type },
    });
    if (!exists) {
      await dietaryRestrictionRepo.save(
        dietaryRestrictionRepo.create({
          tenant_id: tenant!.id,
          student_id: student.id,
          restriction_type: type,
          details,
          recorded_by: schoolAdmin1.id,
        }),
      );
    }
  }
  await ensureDietaryRestriction('Grade 6 - A-2', DietaryRestrictionType.VEGETARIAN, 'Family requests vegetarian meals only'); // Diya Patel
  await ensureDietaryRestriction('Grade 7 - A-1', DietaryRestrictionType.ALLERGY, 'Peanut allergy — cross-reference with Health & Wellness profile'); // Sara Khan

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Demo tenant subdomain: "demo". Test password: Password123!`);
  // eslint-disable-next-line no-console
  console.log(
    `Test accounts of interest: teacher1@demo.schoolerp.test (scoped to Grade 6 - A), ` +
      `teacher3@demo.schoolerp.test (scoped to Grade 7 - A), ` +
      `teacher2@demo.schoolerp.test (unassigned — sees everything), ` +
      `student1@demo.schoolerp.test (linked to Aarav Sharma, Grade 6 - A, roll #1).`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Library: 5 titles seeded with copies at Main Campus. One Harry Potter copy is ` +
      `deliberately overdue, issued to Aarav Sharma (due 2025-06-29).`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Transportation: 2 vehicles, 2 drivers, 2 routes (North Loop / South Loop) with stops, ` +
      `both routes assigned for the current academic year. Aarav Sharma rides North Loop ` +
      `to Green Park Gate.`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Health & Wellness: 4 health profiles across Grade 6-A / 6-B / 7-A (to exercise Teacher ` +
      `class-scoping), plus an immunization record and clinic visit for Aarav Sharma, a ` +
      `medication record for Diya Patel, and a Vision Screening 2026 campaign with 2 results. ` +
      `teacher1 should see only Aarav + Diya's data; teacher3 should see only Sara Khan's.`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Inventory & Assets: A4 Copy Paper (50 reams, OK) and Whiteboard Markers (7 boxes, ` +
      `deliberately BELOW its reorder point of 10) at Main Campus; Digital Microscope (2 tagged ` +
      `units, INV-1001/1002, in Lab 2) and Student Desk Chair (1 tagged unit, INV-2001, under ` +
      `repair); one pending procurement request for more markers, one approved request for ` +
      `another microscope.`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Cafeteria: 5 menu items, a Lunch menu on 2026-07-06 listing all 5, meal attendance recorded ` +
      `for Aarav Sharma/Diya Patel/Sara Khan on that date, plus dietary restrictions (Diya — ` +
      `vegetarian, Sara — peanut allergy).`,
  );
  await dataSource.destroy();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
