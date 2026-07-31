import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A single dish/food item in the catalog (Blueprint Part 2, Module 22 —
 * "Meal plans & weekly menus"). A DailyMenu is built from a set of these
 * via DailyMenuItem — this is the reusable "what is this dish" record,
 * not tied to any specific day.
 *
 * dietary_tags is a plain comma-separated text field (e.g.
 * "vegetarian, contains_nuts"), same convention as
 * StudentHealthProfile.allergies in Health & Wellness — a simple text
 * field rather than a structured tag table, kept consistent with how
 * this codebase handles free-form multi-value attributes elsewhere.
 */
@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 300, nullable: true })
  dietary_tags?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
