import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Circular } from './entities/circular.entity';
import { CircularReadReceipt } from './entities/circular-read-receipt.entity';
import { Student } from '../students/entities/student.entity';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Circular, CircularReadReceipt, Student])],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
