import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiaryEntry } from './diary-entry.entity';
import { User } from '../../users/entities/user.entity';

@Entity('diary_replies')
export class DiaryReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  diary_entry_id: string;

  @ManyToOne(() => DiaryEntry, (entry) => entry.replies)
  @JoinColumn({ name: 'diary_entry_id' })
  diaryEntry: DiaryEntry;

  @Column({ type: 'uuid' })
  author_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
