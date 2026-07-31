import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityRoster } from './entities/activity-roster.entity';
import { Event } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { Award } from './entities/award.entity';
import { ActivitiesService } from './activities.service';
import { EventsService } from './events.service';
import { AwardsService } from './awards.service';
import { ActivitiesController } from './activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityRoster, Event, EventRegistration, Award])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, EventsService, AwardsService],
  exports: [ActivitiesService, EventsService, AwardsService],
})
export class ActivitiesModule {}
