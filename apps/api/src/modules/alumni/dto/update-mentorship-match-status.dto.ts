import { IsEnum } from 'class-validator';
import { MentorshipMatchStatus } from '../entities/mentorship-match.entity';

export class UpdateMentorshipMatchStatusDto {
  @IsEnum(MentorshipMatchStatus)
  status: MentorshipMatchStatus;
}
