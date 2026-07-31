import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeeComponent } from './fee-component.entity';
import { FeeInstallment } from './fee-installment.entity';

/**
 * A reusable fee template — defined once per grade/year, then applied
 * ("assigned") to many students, rather than configuring fees one student at
 * a time. Matches how schools actually set fees (per blueprint Part 2,
 * Module 8: "Configurable fee structures & installment plans").
 */
@Entity('fee_structures')
@Index(['tenant_id', 'academic_year_id', 'grade_level'])
export class FeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  academic_year_id: string;

  @Column({ length: 40 })
  grade_level: string;

  /** e.g. "Grade 5 Fees 2026-27" */
  @Column({ length: 150 })
  name: string;

  /**
   * Distinguishes companion structures for the same grade/year — e.g.
   * "Grade 1 - With Transport" (true) vs "Grade 1 - Without Transport"
   * (false) — so the parent self-service transport toggle can look up
   * the right structure by this flag instead of matching on `name`.
   * Defaults true since transport was bundled into every structure
   * before this column existed.
   */
  @Column({ default: true })
  transport_included: boolean;

  @OneToMany(() => FeeComponent, (c) => c.fee_structure)
  components: FeeComponent[];

  @OneToMany(() => FeeInstallment, (i) => i.fee_structure)
  installments: FeeInstallment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
