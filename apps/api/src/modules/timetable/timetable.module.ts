import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableSlot } from './entities/timetable-slot.entity';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { ClassElectiveOffering } from '../classes/entities/class-elective-offering.entity';
import { TeacherSubjectSpecialization } from '../subjects/entities/teacher-subject-specialization.entity';
import { SchoolClass } from '../classes/entities/school-class.entity';

@Module({
  // ClassElectiveOffering, TeacherSubjectSpecialization, and SchoolClass
  // registered directly (entity-only, not full module imports) so
  // TimetableService can query them for the elective-period auto-placement
  // feature — avoids importing ClassesModule/SubjectsModule as whole
  // modules, which risks circular dependencies (ClassesModule already
  // imports SubjectsModule) for no real benefit here, since only direct
  // repo reads are needed, not those modules' business logic.
  imports: [
    TypeOrmModule.forFeature([TimetableSlot, ClassElectiveOffering, TeacherSubjectSpecialization, SchoolClass]),
  ],
  controllers: [TimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}
