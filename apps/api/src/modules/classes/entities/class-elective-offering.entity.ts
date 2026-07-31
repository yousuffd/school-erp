import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Which elective subjects a SPECIFIC class makes available — a class only
 * offers a subset of the tenant's full elective catalog (e.g. Grade 5-A
 * offers French+Spanish, Grade 6-A offers French+Hindi), not everything
 * marked Subject.is_elective tenant-wide.
 */
@Entity('class_elective_offerings')
@Index(['tenant_id', 'school_class_id', 'subject_id'], { unique: true })
export class ClassElectiveOffering {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  school_class_id: string;

  @Column('uuid')
  subject_id: string;

  @CreateDateColumn()
  created_at: Date;
}