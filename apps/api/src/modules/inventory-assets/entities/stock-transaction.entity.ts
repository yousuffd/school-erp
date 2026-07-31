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

export enum StockTransactionType {
  RECEIVED = 'received',
  ISSUED = 'issued',
  ADJUSTED = 'adjusted',
}

/**
 * A single stock movement for a non-trackable (bulk) Item at one campus
 * (Blueprint Part 2, Module 15). This is the audit log that drives
 * ItemStock.quantity_on_hand — the stock level itself is derived, never
 * edited directly.
 *
 * quantity's meaning depends on transaction_type — deliberately NOT a
 * uniform signed delta, to match how a real inventory clerk actually
 * thinks about each action:
 *   - RECEIVED: quantity is the amount added (always positive)
 *   - ISSUED: quantity is the amount removed (always positive; the
 *     service subtracts it, guarding against going negative)
 *   - ADJUSTED: quantity is the new ABSOLUTE stock count (a physical
 *     recount correction), not a delta — matches how stock-take
 *     corrections work in practice ("we counted 42, not 50")
 */
@Entity('stock_transactions')
export class StockTransaction {
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

  @Column({ type: 'enum', enum: StockTransactionType })
  transaction_type: StockTransactionType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column('uuid')
  recorded_by: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
