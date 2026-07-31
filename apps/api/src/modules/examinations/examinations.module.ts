import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamResult } from './entities/exam-result.entity';
import { ExamGroup } from './entities/exam-group.entity';
import { ExamsService } from './exams.service';
import { ReportCardsService } from './report-cards.service';
import { ExamGroupsService } from './exam-groups.service';
import { ExamsController } from './exams.controller';
import { ReportCardsController } from './report-cards.controller';
import { ExamGroupsController } from './exam-groups.controller';
import { StudentsModule } from '../students/students.module';
import { TenantsModule } from '../tenants/tenants.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { AcademicYearsModule } from '../academic-years/academic-years.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { TimetableModule } from '../timetable/timetable.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamResult, ExamGroup]),
    StudentsModule,
    TenantsModule,
    SubjectsModule,
    AcademicYearsModule,
    AttendanceModule,
    TimetableModule,
  ],
  controllers: [ExamsController, ReportCardsController, ExamGroupsController],
  providers: [ExamsService, ReportCardsService, ExamGroupsService],
  exports: [ExamsService, ReportCardsService, ExamGroupsService],
})
export class ExaminationsModule {}
