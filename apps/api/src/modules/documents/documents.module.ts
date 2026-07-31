import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentAcknowledgment } from './entities/document-acknowledgment.entity';
import { Certificate } from './entities/certificate.entity';
import { DocumentsService } from './documents.service';
import { CertificatesService } from './certificates.service';
import { DocumentsController } from './documents.controller';
import { StudentsModule } from '../students/students.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentAcknowledgment, Certificate]),
    StudentsModule,
    TenantsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, CertificatesService],
  exports: [DocumentsService, CertificatesService],
})
export class DocumentsModule {}
