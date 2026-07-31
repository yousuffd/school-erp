import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FeeStructure } from './fee-structure.entity';

/** A single line item within a fee structure, e.g. "Tuition" — ₹40,000. */
@Entity('fee_components')
export class FeeComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  fee_structure_id: string;

  @ManyToOne(() => FeeStructure, (s) => s.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fee_structure_id' })
  fee_structure: FeeStructure;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string; // numeric columns come back as strings from pg — kept as string end-to-end to avoid float rounding on money
}
