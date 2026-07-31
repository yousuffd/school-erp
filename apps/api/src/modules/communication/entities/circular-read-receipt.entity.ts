import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Tracks which staff member read which circular, and when — the "delivery & read-receipt tracking" feature, scoped to in-app reads since there's no actual SMS/email/push delivery to track receipts for. */
@Entity('circular_read_receipts')
@Index(['circular_id', 'user_id'], { unique: true })
export class CircularReadReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  circular_id: string;

  @Column('uuid')
  user_id: string;

  @CreateDateColumn()
  read_at: Date;
}
