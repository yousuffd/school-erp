import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEntry } from './entities/diary-entry.entity';
import { DiaryReply } from './entities/diary-reply.entity';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { Student } from '../students/entities/student.entity';
import { SchoolClass } from '../classes/entities/school-class.entity';
import { TimetableModule } from '../timetable/timetable.module'; // VERIFY: confirm this exports TimetableService

@Module({
  imports: [
    TypeOrmModule.forFeature([DiaryEntry, DiaryReply, Student, SchoolClass]),
    TimetableModule,
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}

// Register DiaryModule in app.module.ts's imports array, alongside
// HostelModule / LibraryModule / CafeteriaModule etc.