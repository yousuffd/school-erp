import 'reflect-metadata';
import dataSource from '../config/typeorm.config';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { Campus } from '../modules/campuses/entities/campus.entity';
import { AcademicYear } from '../modules/academic-years/entities/academic-year.entity';
import { SchoolClass } from '../modules/classes/entities/school-class.entity';
import { Subject } from '../modules/subjects/entities/subject.entity';
import { Student, Gender, StudentLifecycleStatus } from '../modules/students/entities/student.entity';
import { AttendanceRecord, AttendanceStatus } from '../modules/attendance/entities/attendance-record.entity';
import { Exam } from '../modules/examinations/entities/exam.entity';
import { ExamResult } from '../modules/examinations/entities/exam-result.entity';
import { FeeStructure } from '../modules/fees/entities/fee-structure.entity';
import { FeeComponent } from '../modules/fees/entities/fee-component.entity';
import { FeeAssignment } from '../modules/fees/entities/fee-assignment.entity';
import { FeePayment, PaymentMethod } from '../modules/fees/entities/fee-payment.entity';
import { Employee, EmploymentType, EmployeeStatus } from '../modules/hr-management/entities/employee.entity';
import {
  StaffAttendanceRecord,
  StaffAttendanceStatus,
} from '../modules/hr-management/entities/staff-attendance-record.entity';
import { User } from '../modules/users/entities/user.entity';

/**
 * Seeds realistic sample data into a single named tenant, for demo/pitch
 * purposes — built to back the Principal dashboard's metric cards with real,
 * computed numbers rather than fabricated ones. Deliberately calibrated to
 * land close to the example figures in the Dashboard Metrics spec (~92.8%
 * attendance, ~86% fee collection, a real Grade 9 Math dip) — not forced to
 * match exactly, since these come from actual generated data, but close
 * enough that the demo numbers feel intentional rather than random.
 *
 * Guarded by a single check (does this tenant already have students?) so
 * it's safe to re-run without creating duplicates — if you need to reseed
 * from scratch, clear the tenant's data first.
 *
 * Usage:
 *   TENANT_SUBDOMAIN="riverdale" npx ts-node src/database/seed-demo-data.ts
 */

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Ayaan', 'Krishna',
  'Ishaan', 'Rohan', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Myra',
  'Anika', 'Navya', 'Pari', 'Riya', 'Sai', 'Dev', 'Kabir', 'Advait', 'Yash',
  'Zara', 'Ira', 'Meera', 'Tara', 'Anaya',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Iyer', 'Nair', 'Reddy', 'Rao', 'Menon',
  'Kapoor', 'Malhotra', 'Chatterjee', 'Bose', 'Pillai', 'Desai', 'Joshi',
  'Kulkarni', 'Bhatt', 'Agarwal', 'Chauhan', 'Mehta',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}
function randRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function weekdaysInMonth(year: number, monthIndex0: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, monthIndex0, 1);
  while (d.getMonth() === monthIndex0) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

async function seedDemoData() {
  const subdomain = process.env.TENANT_SUBDOMAIN;
  if (!subdomain) {
    console.error('Usage: TENANT_SUBDOMAIN="riverdale" npx ts-node src/database/seed-demo-data.ts');
    process.exit(1);
  }

  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  const tenant = await qr.manager.getRepository(Tenant).findOne({ where: { subdomain } });
  if (!tenant) {
    console.error(`No tenant found with subdomain '${subdomain}'.`);
    await dataSource.destroy();
    process.exit(1);
  }
  const tenantId = tenant.id;
  await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
  const m = qr.manager;

  const existingStudents = await m.getRepository(Student).count({ where: { tenant_id: tenantId } });
  if (existingStudents > 0) {
    console.log(`Tenant '${subdomain}' already has ${existingStudents} students — skipping to avoid duplicates.`);
    await dataSource.destroy();
    return;
  }

  const admin = await m
    .getRepository(User)
    .createQueryBuilder('u')
    .where('u.tenant_id = :tenantId', { tenantId })
    .getOne();
  if (!admin) {
    console.error(`No admin user found for tenant '${subdomain}' — provision one first.`);
    await dataSource.destroy();
    process.exit(1);
  }
  const actorId = admin.id;

  console.log(`Seeding demo data for '${subdomain}' (tenant ${tenantId})...`);

  // --- Campus + Academic Year ---------------------------------------------
  let campus = await m.getRepository(Campus).findOne({ where: { tenant_id: tenantId, name: 'Main Campus' } });
  if (!campus) {
    campus = await m
      .getRepository(Campus)
      .save(m.getRepository(Campus).create({ tenant_id: tenantId, name: 'Main Campus', timezone: 'Asia/Kolkata' }));
  }

  const now = new Date();
  const yearLabel = `${now.getFullYear() - (now.getMonth() < 5 ? 1 : 0)}-${String((now.getFullYear() - (now.getMonth() < 5 ? 1 : 0)) + 1).slice(-2)}`;
  let academicYear = await m.getRepository(AcademicYear).findOne({ where: { tenant_id: tenantId, label: yearLabel } });
  if (!academicYear) {
    academicYear = await m.getRepository(AcademicYear).save(
      m.getRepository(AcademicYear).create({
        tenant_id: tenantId,
        label: yearLabel,
        start_date: `${now.getFullYear() - (now.getMonth() < 5 ? 1 : 0)}-06-01`,
        end_date: `${now.getFullYear() + (now.getMonth() < 5 ? 0 : 1)}-04-30`,
        is_current: true,
      }),
    );
  }

  // --- Classes (3 grades x 2 sections) ------------------------------------
  const gradeSections = [
    { grade: '8', section: 'A' },
    { grade: '8', section: 'B' },
    { grade: '9', section: 'A' },
    { grade: '9', section: 'B' },
    { grade: '10', section: 'A' },
    { grade: '10', section: 'B' },
  ];
  // The three classes intentionally seeded with a real attendance dip this
  // month, for the "3 classes below 85%" exception card.
  const LOW_ATTENDANCE_CLASSES = new Set(['8-B', '9-B', '10-B']);

  const classes: SchoolClass[] = [];
  for (const gs of gradeSections) {
    let cls = await m.getRepository(SchoolClass).findOne({
      where: { tenant_id: tenantId, academic_year_id: academicYear.id, grade_level: gs.grade, section: gs.section },
    });
    if (!cls) {
      cls = await m.getRepository(SchoolClass).save(
        m.getRepository(SchoolClass).create({
          tenant_id: tenantId,
          campus_id: campus.id,
          academic_year_id: academicYear.id,
          grade_level: gs.grade,
          section: gs.section,
        }),
      );
    }
    classes.push(cls);
  }

  // --- Subjects ------------------------------------------------------------
  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Studies', code: 'SOC' },
  ];
  const subjects: Subject[] = [];
  for (const sd of subjectDefs) {
    let subj = await m.getRepository(Subject).findOne({ where: { tenant_id: tenantId, code: sd.code } });
    if (!subj) {
      subj = await m
        .getRepository(Subject)
        .save(m.getRepository(Subject).create({ tenant_id: tenantId, name: sd.name, code: sd.code }));
    }
    subjects.push(subj);
  }
  const mathSubject = subjects.find((s) => s.code === 'MATH')!;

  // --- Students (10 per class) ---------------------------------------------
  let admissionSeq = 1;
  const studentsByClass = new Map<string, Student[]>();
  for (const cls of classes) {
    const roster: Student[] = [];
    for (let i = 0; i < 10; i++) {
      const seed = admissionSeq + i;
      const firstName = pick(FIRST_NAMES, seed);
      const lastName = pick(LAST_NAMES, seed * 3 + 1);
      const student = await m.getRepository(Student).save(
        m.getRepository(Student).create({
          tenant_id: tenantId,
          campus_id: campus.id,
          admission_number: `ADM-${now.getFullYear()}-${String(admissionSeq).padStart(4, '0')}`,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: `${now.getFullYear() - 14 - randRange(0, 2)}-${String(randRange(1, 12)).padStart(2, '0')}-${String(randRange(1, 28)).padStart(2, '0')}`,
          gender: seed % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          grade_level: cls.grade_level,
          section: cls.section,
          school_class_id: cls.id,
          academic_year_id: academicYear.id,
          status: StudentLifecycleStatus.ACTIVE,
          enrollment_date: `${now.getFullYear() - (now.getMonth() < 5 ? 1 : 0)}-06-15`,
          guardian_name: `${pick(FIRST_NAMES, seed + 7)} ${lastName}`,
          guardian_phone: `+91${randRange(7000000000, 9999999999)}`,
        }),
      );
      roster.push(student);
      admissionSeq++;
    }
    studentsByClass.set(cls.id, roster);
    console.log(`  Created 10 students for Grade ${cls.grade_level}-${cls.section}`);
  }

  // --- Attendance: this month + previous month -----------------------------
  const thisMonthDays = weekdaysInMonth(now.getFullYear(), now.getMonth()).filter((d) => d <= now);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthDays = weekdaysInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());

  let attendanceCount = 0;
  for (const cls of classes) {
    const classKey = `${cls.grade_level}-${cls.section}`;
    const isLowClass = LOW_ATTENDANCE_CLASSES.has(classKey);
    const roster = studentsByClass.get(cls.id)!;

    for (const [days, isCurrentMonth] of [
      [prevMonthDays, false],
      [thisMonthDays, true],
    ] as const) {
      // Present probability: normal classes ~95-97%, low-attendance classes
      // dip further specifically this month (~78-83%) to trigger the
      // exception card — previous month they're only mildly lower (~90%),
      // so the MoM trend is real and gradual, not a step function.
      const presentProb = isLowClass
        ? isCurrentMonth
          ? 0.8
          : 0.9
        : isCurrentMonth
          ? 0.93
          : 0.96;

      for (const day of days) {
        for (const student of roster) {
          const r = Math.random();
          const status =
            r < presentProb
              ? AttendanceStatus.PRESENT
              : r < presentProb + 0.03
                ? AttendanceStatus.LATE
                : r < presentProb + 0.05
                  ? AttendanceStatus.EXCUSED
                  : AttendanceStatus.ABSENT;
          await m.getRepository(AttendanceRecord).save(
            m.getRepository(AttendanceRecord).create({
              tenant_id: tenantId,
              school_class_id: cls.id,
              student_id: student.id,
              date: toDateStr(day),
              status,
              marked_by: actorId,
            }),
          );
          attendanceCount++;
        }
      }
    }
  }
  console.log(`  Created ${attendanceCount} attendance records across 2 months`);

  // --- Exams: two rounds, with a real Grade 9 Math dip ---------------------
  let examCount = 0;
  let resultCount = 0;
  const round1Date = toDateStr(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 15));
  const round2Date = toDateStr(new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 3)));

  for (const cls of classes) {
    const roster = studentsByClass.get(cls.id)!;
    const isGrade9Math = cls.grade_level === '9';

    for (const subject of subjects) {
      for (const [roundName, roundDate, isRound2] of [
        ['Term 1 Assessment', round1Date, false],
        ['Term 2 Assessment', round2Date, true],
      ] as const) {
        const exam = await m.getRepository(Exam).save(
          m.getRepository(Exam).create({
            tenant_id: tenantId,
            subject_id: subject.id,
            school_class_id: cls.id,
            academic_year_id: academicYear.id,
            name: `${roundName} - ${subject.name}`,
            exam_date: roundDate,
            max_marks: '100',
            created_by: actorId,
          }),
        );
        examCount++;

        // Baseline: most subjects average ~72-80%, stable or slightly
        // improving round-over-round. Grade 9 Mathematics specifically
        // drops ~7 points in round 2 — the exception card's real signal.
        const isMathDipCase = isGrade9Math && subject.id === mathSubject.id;
        const baseAvg = isMathDipCase ? (isRound2 ? 63 : 70) : isRound2 ? randRange(74, 82) : randRange(72, 80);

        for (const student of roster) {
          const marks = Math.max(20, Math.min(100, baseAvg + randRange(-12, 12)));
          await m.getRepository(ExamResult).save(
            m.getRepository(ExamResult).create({
              tenant_id: tenantId,
              exam_id: exam.id,
              student_id: student.id,
              marks_obtained: String(marks),
              entered_by: actorId,
            }),
          );
          resultCount++;
        }
      }
    }
  }
  console.log(`  Created ${examCount} exams, ${resultCount} exam results`);

  // --- Fee structures + assignments + payments (~86% collected) -----------
  let paymentTotal = 0;
  let assignedTotal = 0;
  for (const grade of ['8', '9', '10']) {
    let structure = await m
      .getRepository(FeeStructure)
      .findOne({ where: { tenant_id: tenantId, academic_year_id: academicYear.id, grade_level: grade } });
    if (!structure) {
      structure = await m.getRepository(FeeStructure).save(
        m.getRepository(FeeStructure).create({
          tenant_id: tenantId,
          academic_year_id: academicYear.id,
          grade_level: grade,
          name: `Grade ${grade} Fees ${yearLabel}`,
        }),
      );
      await m.getRepository(FeeComponent).save([
        m.getRepository(FeeComponent).create({ fee_structure_id: structure.id, name: 'Tuition', amount: '38000' }),
        m.getRepository(FeeComponent).create({ fee_structure_id: structure.id, name: 'Transport', amount: '5000' }),
        m.getRepository(FeeComponent).create({ fee_structure_id: structure.id, name: 'Activity Fee', amount: '2000' }),
      ]);
    }
    const structureTotal = 45000;

    const gradeClasses = classes.filter((c) => c.grade_level === grade);
    for (const cls of gradeClasses) {
      const roster = studentsByClass.get(cls.id)!;
      for (const student of roster) {
        const assignment = await m.getRepository(FeeAssignment).save(
          m.getRepository(FeeAssignment).create({
            tenant_id: tenantId,
            student_id: student.id,
            fee_structure_id: structure.id,
            academic_year_id: academicYear.id,
          }),
        );
        assignedTotal += structureTotal;

        // ~86% of students have paid in full or nearly full; the rest are
        // genuinely overdue, concentrated a bit more in Grades 8-10 evenly
        // (matching the spec's "concentration highest in Grades 8-10" note
        // — here that's simply all three grades, since that's the full
        // student body in this seed).
        const paidFraction = Math.random() < 0.86 ? 1 : Math.random() < 0.5 ? randRange(30, 70) / 100 : 0;
        const paidAmount = Math.round(structureTotal * paidFraction);
        if (paidAmount > 0) {
          await m.getRepository(FeePayment).save(
            m.getRepository(FeePayment).create({
              tenant_id: tenantId,
              fee_assignment_id: assignment.id,
              amount: String(paidAmount),
              payment_date: toDateStr(prevMonthDays[Math.min(prevMonthDays.length - 1, randRange(0, prevMonthDays.length - 1))]),
              method: PaymentMethod.BANK_TRANSFER,
              recorded_by: actorId,
            }),
          );
          paymentTotal += paidAmount;
        }
      }
    }
  }
  console.log(
    `  Created fee structures + assignments; collected ~${Math.round((paymentTotal / assignedTotal) * 100)}% of ₹${assignedTotal.toLocaleString('en-IN')}`,
  );

  // --- Staff + staff attendance (~96% presence) -----------------------------
  const departments = ['Academics', 'Administration', 'Support Staff'];
  const designations = ['Teacher', 'Coordinator', 'Assistant', 'Clerk'];
  const employees: Employee[] = [];
  for (let i = 0; i < 18; i++) {
    const firstName = pick(FIRST_NAMES, i + 100);
    const lastName = pick(LAST_NAMES, i * 2 + 5);
    const emp = await m.getRepository(Employee).save(
      m.getRepository(Employee).create({
        tenant_id: tenantId,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@riverdale.com`,
        department: pick(departments, i),
        designation: pick(designations, i),
        employment_type: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        date_of_joining: `${now.getFullYear() - randRange(1, 5)}-06-01`,
      }),
    );
    employees.push(emp);
  }

  let staffAttendanceCount = 0;
  for (const day of thisMonthDays) {
    for (const emp of employees) {
      const present = Math.random() < 0.96;
      await m.getRepository(StaffAttendanceRecord).save(
        m.getRepository(StaffAttendanceRecord).create({
          tenant_id: tenantId,
          employee_id: emp.id,
          date: toDateStr(day),
          status: present ? StaffAttendanceStatus.PRESENT : StaffAttendanceStatus.ON_LEAVE,
        }),
      );
      staffAttendanceCount++;
    }
  }
  console.log(`  Created ${employees.length} staff, ${staffAttendanceCount} staff attendance records`);

  await qr.commitTransaction();
  console.log(`\nDone. Seeded demo data for '${subdomain}'.`);
  await dataSource.destroy();
}

seedDemoData().catch(async (err) => {
  console.error('Failed to seed demo data:', err);
  await dataSource.destroy().catch(() => undefined);
  process.exit(1);
});
