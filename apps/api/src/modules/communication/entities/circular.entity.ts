import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CircularPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
}

export enum AudienceScope {
  WHOLE_SCHOOL = 'whole_school',
  GRADE = 'grade',
  CLASS = 'class',
  STAFF = 'staff',
}

/**
 * A circular/announcement (Blueprint Part 2, Module 17). "Urgent" priority
 * covers the blueprint's "emergency alert broadcast" — a genuinely separate
 * alert system isn't warranted for Phase 1's scope.
 *
 * IMPORTANT — this is genuinely in-app only. The blueprint's "SMS, email,
 * push notifications" require real external integrations (Twilio, SendGrid,
 * FCM per the tech stack) that don't exist in this build. A circular gets
 * created and is visible to whoever has access to view it in the app; it
 * does NOT actually send an SMS, email, or push notification to anyone.
 * That's a genuine external-integration project, not something to fake.
 */
@Entity('circulars')
export class Circular {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: CircularPriority, default: CircularPriority.NORMAL })
  priority: CircularPriority;

  @Column({ type: 'enum', enum: AudienceScope })
  audience_scope: AudienceScope;

  /** Used only when audience_scope = 'grade'. */
  @Column({ length: 40, nullable: true })
  audience_grade_level?: string;

  /** Used only when audience_scope = 'class'. */
  @Column('uuid', { nullable: true })
  audience_school_class_id?: string;

  @Column('uuid')
  published_by: string;

  @CreateDateColumn()
  published_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
