import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniProfile } from './entities/alumni-profile.entity';
import { AlumniEvent } from './entities/alumni-event.entity';
import { AlumniEventRegistration } from './entities/alumni-event-registration.entity';
import { Donation } from './entities/donation.entity';
import { MentorshipMatch } from './entities/mentorship-match.entity';
import { AlumniProfilesService } from './alumni-profiles.service';
import { AlumniEventsService } from './alumni-events.service';
import { DonationsService } from './donations.service';
import { MentorshipMatchesService } from './mentorship-matches.service';
import { AlumniController } from './alumni.controller';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlumniProfile, AlumniEvent, AlumniEventRegistration, Donation, MentorshipMatch]),
    StudentsModule,
  ],
  controllers: [AlumniController],
  providers: [AlumniProfilesService, AlumniEventsService, DonationsService, MentorshipMatchesService],
  exports: [AlumniProfilesService, AlumniEventsService, DonationsService, MentorshipMatchesService],
})
export class AlumniModule {}
