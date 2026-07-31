import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ItemCategory {
  STATIONERY = 'stationery',
  UNIFORM = 'uniform',
  LAB_EQUIPMENT = 'lab_equipment',
  FURNITURE = 'furniture',
  OTHER = 'other',
}

/**
 * Catalog record for a trackable item (Blueprint Part 2, Module 15 —
 * "Stationery, uniforms, lab equipment, furniture tracking"). Mirrors
 * Library's Book/BookCopy split: is_trackable_asset decides whether
 * individual physical units get their own AssetTag row (furniture, lab
 * equipment — things worth tracking one-by-one) or whether the item is
 * tracked as a bulk quantity via ItemStock/StockTransaction (stationery,
 * consumables — things you count, not individually tag).
 *
 * reorder_point is only meaningful for non-trackable (bulk) items — not
 * enforced at the DB level, a service-layer convention.
 *
 * Deliberately NOT included this pass: real depreciation calculation or
 * any link into a Finance & Accounting ledger — that module doesn't exist
 * yet. AssetTag still records purchase_cost/purchase_date as plain
 * record-keeping fields, but nothing computes depreciation from them.
 */
@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: ItemCategory })
  category: ItemCategory;

  @Column({ length: 20 })
  unit: string;

  @Column({ default: false })
  is_trackable_asset: boolean;

  @Column({ type: 'int', nullable: true })
  reorder_point?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
