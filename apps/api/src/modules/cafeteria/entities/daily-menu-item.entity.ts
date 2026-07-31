import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DailyMenu } from './daily-menu.entity';
import { MenuItem } from './menu-item.entity';

/**
 * Which MenuItem dishes appear on a given DailyMenu (Blueprint Part 2,
 * Module 22). Plain join table — a dish can appear on many daily menus
 * over time, and a daily menu typically lists several dishes.
 */
@Entity('daily_menu_items')
@Index(['tenant_id', 'daily_menu_id', 'menu_item_id'], { unique: true })
export class DailyMenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  daily_menu_id: string;

  @ManyToOne(() => DailyMenu, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'daily_menu_id' })
  daily_menu: DailyMenu;

  @Column('uuid')
  menu_item_id: string;

  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_item_id' })
  menu_item: MenuItem;

  @CreateDateColumn()
  created_at: Date;
}
