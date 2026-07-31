import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { LearningResource } from './entities/learning-resource.entity';
import { Lecture } from './entities/lecture.entity';
import { LectureProgress } from './entities/lecture-progress.entity';
import { DiscussionThread } from './entities/discussion-thread.entity';
import { DiscussionPost } from './entities/discussion-post.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { AssignmentSubmissionsService } from './assignment-submissions.service';
import { AssignmentSubmissionsController } from './assignment-submissions.controller';
import { LearningResourcesService } from './learning-resources.service';
import { LearningResourcesController } from './learning-resources.controller';
import { LecturesService } from './lectures.service';
import { LecturesController } from './lectures.controller';
import { DiscussionsService } from './discussions.service';
import { DiscussionsController } from './discussions.controller';
import { StudentsModule } from '../students/students.module';
import { TenantsModule } from '../tenants/tenants.module';
import { TimetableModule } from '../timetable/timetable.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      AssignmentSubmission,
      LearningResource,
      Lecture,
      LectureProgress,
      DiscussionThread,
      DiscussionPost,
    ]),
    StudentsModule,
    TenantsModule,
    TimetableModule,
    AuthModule,
  ],
  controllers: [
    AssignmentsController,
    AssignmentSubmissionsController,
    LearningResourcesController,
    LecturesController,
    DiscussionsController,
  ],
  providers: [
    AssignmentsService,
    AssignmentSubmissionsService,
    LearningResourcesService,
    LecturesService,
    DiscussionsService,
  ],
  exports: [AssignmentsService, AssignmentSubmissionsService, LearningResourcesService, LecturesService, DiscussionsService],
})
export class LmsModule {}