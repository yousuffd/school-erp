import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Item } from './item.entity';

export enum AssetTagStatus {
  IN_USE = 'in_use',
  UNDER_REPAIR = 'under_repair',
  RETIRED = 'retired',
  LOST = 'lost',
}

/**
 * One individually tracked physical unit of a trackable Item (Blueprint
 * Part 2, Module 15 — "Asset tagging"). Mirrors BookCopy: an Item is the
 * catalog entry (e.g. "Dell Latitude Laptop"), an AssetTag is one
 * physical unit of it (asset tag #INV-0042, currently in Lab 2).
 *
 * purchase_cost/purchase_date are plain record-keeping fields — no
 * depreciation calculation or Finance module linkage exists yet (see
 * item.entity.ts for the full note on that deferral).
 */
@Entity('asset_tags')
@Index(['tenant_id', 'asset_tag_number'], { unique: true })
export class AssetTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  item_id: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column('uuid')
  campus_id: string;

  @Column({ length: 50 })
  asset_tag_number: string;

  @Column({ type: 'enum', enum: AssetTagStatus, default: AssetTagStatus.IN_USE })
  status: AssetTagStatus;

  @Column({ length: 150, nullable: true })
  assigned_location?: string;

  @Column({ type: 'date', nullable: true })
  purchase_date?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  purchase_cost?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
