import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentHealthProfile } from './entities/student-health-profile.entity';
import { ImmunizationRecord } from './entities/immunization-record.entity';
import { ClinicVisit } from './entities/clinic-visit.entity';
import { MedicationAdministration } from './entities/medication-administration.entity';
import { ScreeningCampaign } from './entities/screening-campaign.entity';
import { ScreeningResult } from './entities/screening-result.entity';
import { Student } from '../students/entities/student.entity';
import { StudentHealthProfilesService } from './student-health-profiles.service';
import { ImmunizationRecordsService } from './immunization-records.service';
import { ClinicVisitsService } from './clinic-visits.service';
import { MedicationAdministrationsService } from './medication-administrations.service';
import { ScreeningCampaignsService } from './screening-campaigns.service';
import { ScreeningResultsService } from './screening-results.service';
import { HealthWellnessController } from './health-wellness.controller';
import { TimetableModule } from '../timetable/timetable.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentHealthProfile,
      ImmunizationRecord,
      ClinicVisit,
      MedicationAdministration,
      ScreeningCampaign,
      ScreeningResult,
      Student,
    ]),
    TimetableModule,
  ],
  controllers: [HealthWellnessController],
  providers: [
    StudentHealthProfilesService,
    ImmunizationRecordsService,
    ClinicVisitsService,
    MedicationAdministrationsService,
    ScreeningCampaignsService,
    ScreeningResultsService,
  ],
  exports: [
    StudentHealthProfilesService,
    ImmunizationRecordsService,
    ClinicVisitsService,
    MedicationAdministrationsService,
    ScreeningCampaignsService,
    ScreeningResultsService,
  ],
})
export class HealthWellnessModule {}
