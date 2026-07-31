import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { ExamsService } from './exams.service';
import { calculateGrade, calculatePercentage } from './utils/grading.util';
import { StudentsService } from '../students/students.service';
import { TenantsService } from '../tenants/tenants.service';
import { SubjectsService } from '../subjects/subjects.service';
import { AcademicYearsService } from '../academic-years/academic-years.service';
import { AttendanceService } from '../attendance/attendance.service';

export interface ReportCardRow {
  subject: string;
  examName: string;
  maxMarks: number;
  marksObtained: number | null;
  percentage: number | null;
  grade: string | null;
}

export interface ReportCardData {
  studentName: string;
  admissionNumber: string;
  gradeLevel: string;
  section?: string;
  rollNumber?: number;
  academicYearLabel: string;
  schoolName: string;
  rows: ReportCardRow[];
  totalObtained: number;
  totalMax: number;
  overallPercentage: number;
  overallGrade: string;
  attendancePercentage: number | null;
}

@Injectable()
export class ReportCardsService {
  constructor(
    private readonly examsService: ExamsService,
    private readonly studentsService: StudentsService,
    private readonly tenantsService: TenantsService,
    private readonly subjectsService: SubjectsService,
    private readonly academicYearsService: AcademicYearsService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async generateReportCardData(
    studentId: string,
    academicYearId: string,
    tenantId: string,
    requestingUserId: string,
    examName?: string,
  ): Promise<ReportCardData> {
    const [student, year, results] = await Promise.all([
      this.studentsService.findOne(studentId),
      this.academicYearsService.findOne(academicYearId),
      this.examsService.findResultsForStudent(studentId, academicYearId, examName),
    ]);
    const tenant = await this.tenantsService.findOne(student.tenant_id);

    const subjectCache = new Map<string, string>();
    const rows: ReportCardRow[] = [];
    let totalObtained = 0;
    let totalMax = 0;

    for (const result of results) {
      if (!subjectCache.has(result.exam.subject_id)) {
        const subject = await this.subjectsService.findOne(result.exam.subject_id);
        subjectCache.set(result.exam.subject_id, subject.name);
      }
      const maxMarks = parseFloat(result.exam.max_marks);
      const marksObtained = result.marks_obtained != null ? parseFloat(result.marks_obtained) : null;
      const percentage = marksObtained != null ? calculatePercentage(marksObtained, maxMarks) : null;

      rows.push({
        subject: subjectCache.get(result.exam.subject_id)!,
        examName: result.exam.name,
        maxMarks,
        marksObtained,
        percentage,
        grade: percentage != null ? calculateGrade(percentage) : null,
      });

      if (marksObtained != null) {
        totalObtained += marksObtained;
        totalMax += maxMarks;
      }
    }

    const overallPercentage = totalMax > 0 ? calculatePercentage(totalObtained, totalMax) : 0;

    // Attendance % for the academic year — a nice authentic touch real
    // report cards include, and we already have the real data for it.
    const attendanceRecords = await this.attendanceService.findForStudent(
      tenantId,
      requestingUserId,
      studentId,
      year.start_date,
      year.end_date,
    );
    const attendancePercentage =
      attendanceRecords.length > 0
        ? (attendanceRecords.filter((r) => r.status === 'present' || r.status === 'late').length /
            attendanceRecords.length) *
          100
        : null;

    return {
      studentName: `${student.first_name} ${student.last_name}`,
      admissionNumber: student.admission_number,
      gradeLevel: student.grade_level,
      section: student.section,
      rollNumber: student.roll_number,
      academicYearLabel: year.label,
      schoolName: tenant?.school_name ?? 'SchoolERP',
      rows,
      totalObtained,
      totalMax,
      overallPercentage,
      overallGrade: totalMax > 0 ? calculateGrade(overallPercentage) : 'N/A',
      attendancePercentage,
    };
  }

  /**
   * Renders the aggregated data as a formatted, tabular report card PDF —
   * styled like an actual school report card (header, per-subject table,
   * overall summary, attendance line), not just a plain data dump.
   */
  async generateReportCardPdf(
    studentId: string,
    academicYearId: string,
    tenantId: string,
    requestingUserId: string,
    examName?: string,
  ): Promise<Buffer> {
    const data = await this.generateReportCardData(studentId, academicYearId, tenantId, requestingUserId, examName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- Header ---
      doc.fontSize(20).fillColor('black').text(data.schoolName, { align: 'center' });
      doc.fontSize(14).fillColor('#0D9488').text('Report Card', { align: 'center' });
      doc.fontSize(10).fillColor('#6B7688').text(data.academicYearLabel, { align: 'center' });
      doc.moveDown(1.5);

      // --- Student info ---
      doc.fillColor('black').fontSize(11);
      doc.text(`Student: ${data.studentName}`);
      doc.text(`Admission No: ${data.admissionNumber}`);
      doc.text(
        `Class: ${data.gradeLevel}${data.section ? ` - ${data.section}` : ''}${data.rollNumber ? `  |  Roll #${data.rollNumber}` : ''}`,
      );
      if (data.attendancePercentage != null) {
        doc.text(`Attendance: ${data.attendancePercentage.toFixed(1)}%`);
      }
      doc.moveDown(1);

      // --- Results table ---
      const tableTop = doc.y;
      const colX = { subject: 50, exam: 180, max: 340, obtained: 400, pct: 460, grade: 520 };

      doc.fontSize(9).fillColor('#6B7688');
      doc.text('Subject', colX.subject, tableTop);
      doc.text('Exam', colX.exam, tableTop);
      doc.text('Max', colX.max, tableTop);
      doc.text('Obtained', colX.obtained, tableTop);
      doc.text('%', colX.pct, tableTop);
      doc.text('Grade', colX.grade, tableTop);
      doc.moveTo(50, tableTop + 14).lineTo(560, tableTop + 14).strokeColor('#E5E9F0').stroke();

      let y = tableTop + 20;
      doc.fillColor('black').fontSize(10);
      for (const row of data.rows) {
        doc.text(row.subject, colX.subject, y, { width: 125 });
        doc.text(row.examName, colX.exam, y, { width: 155 });
        doc.text(row.maxMarks.toFixed(2), colX.max, y);
        doc.text(row.marksObtained != null ? row.marksObtained.toFixed(2) : 'Absent', colX.obtained, y);
        doc.text(row.percentage != null ? `${row.percentage.toFixed(1)}%` : '—', colX.pct, y);
        doc.text(row.grade ?? '—', colX.grade, y);
        y += 20;
      }

      doc.moveTo(50, y + 5).lineTo(560, y + 5).strokeColor('#E5E9F0').stroke();
      y += 15;

      // --- Overall summary ---
      doc.fontSize(12).fillColor('#0D9488');
      doc.text(
        `Overall: ${data.totalObtained.toFixed(2)} / ${data.totalMax.toFixed(2)}  (${data.overallPercentage.toFixed(1)}%)  —  Grade ${data.overallGrade}`,
        50,
        y,
      );

      doc.moveDown(3);
      doc.fontSize(8).fillColor('#6B7688').text(
        'Grading scale: A+ 90-100, A 80-89, B 70-79, C 60-69, D 50-59, F below 50. System-generated report card.',
      );

      doc.end();
    });
  }
}
