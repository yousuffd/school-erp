import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { TeacherSubjectSpecialization } from './entities/teacher-subject-specialization.entity';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TeacherSubjectSpecializationsService } from './teacher-subject-specializations.service';
import { TeacherSubjectSpecializationsController } from './teacher-subject-specializations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, TeacherSubjectSpecialization])],
  controllers: [SubjectsController, TeacherSubjectSpecializationsController],
  providers: [SubjectsService, TeacherSubjectSpecializationsService],
  exports: [SubjectsService, TeacherSubjectSpecializationsService],
})
export class SubjectsModule {}
