import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE_SSO = 'google_sso',
  MICROSOFT_SSO = 'microsoft_sso',
  SAML = 'saml',
}

export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Entity('users')
@Index(['tenant_id', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid', { nullable: true })
  campus_id?: string | null;

  @Column('uuid')
  role_id: string;

  /**
   * Links this login account to a Student school record, when this user
   * IS a student (as opposed to Admin/Teacher/etc. accounts, where this
   * stays null). Plain uuid column, not a TypeORM relation — same
   * convention as Exam.school_class_id/subject_id — since Users and
   * Students are separate bounded-context modules and this avoids a
   * cross-module entity import. Enforced unique (among non-null values)
   * at the DB level via a partial index — see the migration.
   */
  @Column('uuid', { nullable: true })
  student_id?: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 254 })
  email: string;

  @Column({ length: 32, nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  auth_provider: AuthProvider;

  /** Only set when auth_provider = local; never returned in API responses (see DTO). */
  @Column({ nullable: true, select: false })
  password_hash?: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INVITED })
  status: UserStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}