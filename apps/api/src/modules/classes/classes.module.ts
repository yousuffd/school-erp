import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { ClassElectiveOffering } from './entities/class-elective-offering.entity';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { ClassElectiveOfferingsService } from './class-elective-offerings.service';
import { ClassElectiveOfferingsController } from './class-elective-offerings.controller';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolClass, ClassElectiveOffering]), SubjectsModule],
  controllers: [ClassesController, ClassElectiveOfferingsController],
  providers: [ClassesService, ClassElectiveOfferingsService],
  exports: [ClassesService, ClassElectiveOfferingsService],
})
export class ClassesModule {}