import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum FeeAdjustmentType {
  DISCOUNT = 'discount',
  FINE = 'fine',
}

/** A manual adjustment on a specific fee assignment — sibling discount, late fine, etc. */
@Entity('fee_adjustments')
export class FeeAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  fee_assignment_id: string;

  @Column({ type: 'enum', enum: FeeAdjustmentType })
  type: FeeAdjustmentType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ length: 255 })
  reason: string;

  @Column('uuid')
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}
