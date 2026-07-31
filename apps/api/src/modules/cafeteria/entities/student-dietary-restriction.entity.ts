import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DietaryRestrictionType {
  ALLERGY = 'allergy',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  RELIGIOUS = 'religious',
  OTHER = 'other',
}

/**
 * A dietary flag on a student, for cafeteria planning purposes
 * (Blueprint Part 2, Module 22 — "Allergy & dietary-restriction flagging,
 * linked to Health module"). Deliberately Cafeteria's OWN record, not a
 * duplicate of StudentHealthProfile.allergies in Health & Wellness — that
 * field is the clinical/medical record; this one is what a cafeteria
 * manager actually plans meals around (which includes preferences like
 * vegetarian/religious diets that aren't medical allergies at all). "Linked
 * to Health module" is interpreted here as conceptual awareness/overlap,
 * not a hard foreign key — a student can have both records, kept
 * independently, same as how a school might maintain separate clinic vs.
 * kitchen paperwork in real life.
 */
@Entity('student_dietary_restrictions')
export class StudentDietaryRestriction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'enum', enum: DietaryRestrictionType })
  restriction_type: DietaryRestrictionType;

  @Column({ type: 'text' })
  details: string;

  @Column('uuid')
  recorded_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
