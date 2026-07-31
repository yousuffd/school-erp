import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum CertificateType {
  BONAFIDE = 'bonafide',
  TRANSFER = 'transfer',
  CHARACTER = 'character',
}

/**
 * Blueprint Part 2, Module 19 — "Certificate generation (bonafide,
 * transfer, character)". Deliberately NOT stored via the upload pipeline
 * like Document — a certificate is data-driven and regenerable on demand
 * (same as ReportCardsService.generateReportCardPdf), so this is just an
 * audit record of what was issued, when, by whom; the actual PDF bytes
 * are generated fresh via pdfkit each time it's downloaded, never cached
 * to disk.
 */
@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'enum', enum: CertificateType })
  certificate_type: CertificateType;

  @Column({ type: 'date' })
  issued_date: string;

  @Column('uuid')
  issued_by: string;

  @CreateDateColumn()
  created_at: Date;
}
