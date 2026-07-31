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

/**
 * Current stock quantity for a non-trackable (bulk/consumable) Item at one
 * campus (Blueprint Part 2, Module 15 — "Stock alerts & reorder points").
 * Only meaningful when Item.is_trackable_asset is false — trackable items
 * use AssetTag rows instead. quantity_on_hand is maintained by
 * StockTransaction entries, not edited directly.
 */
@Entity('item_stocks')
@Index(['tenant_id', 'item_id', 'campus_id'], { unique: true })
export class ItemStock {
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

  @Column({ type: 'int', default: 0 })
  quantity_on_hand: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
