import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiaryReply } from './diary-reply.entity';
import { SchoolClass } from '../../classes/entities/school-class.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';

export enum DiaryEntryScope {
  CLASS = 'class',
  STUDENT = 'student',
}

export enum DiaryEntryCategory {
  HOMEWORK = 'Homework',
  REMARK = 'Remark',
  NOTICE = 'Notice',
  GENERAL = 'General',
}

@Entity('diary_entries')
export class DiaryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  campus_id: string;

  @Column({ type: 'uuid' })
  class_id: string;

  @ManyToOne(() => SchoolClass)
  @JoinColumn({ name: 'class_id' })
  schoolClass: SchoolClass;

  @Column({ type: 'enum', enum: DiaryEntryScope })
  scope: DiaryEntryScope;

  @Column({ type: 'uuid', nullable: true })
  student_id: string | null;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student | null;

  @Column({ type: 'uuid' })
  author_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'enum', enum: DiaryEntryCategory, default: DiaryEntryCategory.GENERAL })
  category: DiaryEntryCategory;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'date' })
  entry_date: string;

  @OneToMany(() => DiaryReply, (reply) => reply.diaryEntry)
  replies: DiaryReply[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
