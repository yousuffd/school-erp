import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Links a Parent's User account to one or more Student records — the
 * relationship this project's own Open Question #15 flagged as not
 * existing yet (Examinations Parent access). Many-to-many by design: one
 * parent can have multiple children, and in principle a student could
 * have more than one linked guardian account.
 *
 * parent_user_id is NOT constrained to a specific role at the DB level,
 * matching this project's general data-driven-not-role-hardcoded
 * convention (see TimetableSlot/assertTeacherClassAccess for the same
 * philosophy applied to Teacher scoping) — the Parent-specific behavior
 * lives entirely in how AuthService/JwtStrategy populate the JWT from
 * this table, not in a role check on this entity itself.
 */
@Entity('parent_student_links')
@Index(['tenant_id', 'parent_user_id', 'student_id'], { unique: true })
export class ParentStudentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  parent_user_id: string;

  @Column('uuid')
  student_id: string;

  @CreateDateColumn()
  created_at: Date;
}
