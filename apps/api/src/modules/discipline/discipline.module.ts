import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BehaviorIncident } from './entities/behavior-incident.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { CounselingReferral } from './entities/counseling-referral.entity';
import { IncidentsService } from './incidents.service';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CounselingReferralsService } from './counseling-referrals.service';
import { DisciplineController } from './discipline.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BehaviorIncident, CorrectiveAction, CounselingReferral])],
  controllers: [DisciplineController],
  providers: [IncidentsService, CorrectiveActionsService, CounselingReferralsService],
  exports: [IncidentsService, CorrectiveActionsService, CounselingReferralsService],
})
export class DisciplineModule {}
