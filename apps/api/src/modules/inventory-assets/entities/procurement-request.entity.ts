import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Item } from './item.entity';

export enum ProcurementRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FULFILLED = 'fulfilled',
}

/**
 * A request-to-approve-to-fulfill procurement workflow (Blueprint Part 2,
 * Module 15 — "Procurement requests & approvals"). Fulfillment doesn't
 * automatically create a StockTransaction — marking a request FULFILLED
 * and recording the resulting stock receipt are deliberately separate
 * actions for this pass (a request being approved/fulfilled on paper and
 * the physical stock actually arriving aren't always the same moment).
 */
@Entity('procurement_requests')
export class ProcurementRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  item_id: string;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column('uuid')
  campus_id: string;

  @Column('uuid')
  requested_by: string;

  @Column({ type: 'int' })
  quantity_requested: number;

  @Column({ type: 'enum', enum: ProcurementRequestStatus, default: ProcurementRequestStatus.PENDING })
  status: ProcurementRequestStatus;

  @Column({ type: 'date' })
  requested_date: string;

  @Column('uuid', { nullable: true })
  approved_by?: string;

  @Column({ type: 'date', nullable: true })
  approval_date?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
