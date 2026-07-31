import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { ClassesModule } from '../classes/classes.module';
import { ParentStudentLink } from './entities/parent-student-link.entity';
import { ParentStudentLinksService } from './parent-student-links.service';
import { ParentStudentLinksController } from './parent-student-links.controller';
import { StudentElectiveSelection } from './entities/student-elective-selection.entity';
import { StudentElectiveSelectionsService } from './student-elective-selections.service';
import { StudentElectiveSelectionsController } from './student-elective-selections.controller';
import { SubjectsModule } from '../subjects/subjects.module';
import { AcademicYearsModule } from '../academic-years/academic-years.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, ParentStudentLink, StudentElectiveSelection]),
    ClassesModule,
    SubjectsModule,
    AcademicYearsModule,
  ],
  controllers: [StudentsController, ParentStudentLinksController, StudentElectiveSelectionsController],
  providers: [StudentsService, ParentStudentLinksService, StudentElectiveSelectionsService],
  exports: [StudentsService, ParentStudentLinksService],
})
export class StudentsModule {}