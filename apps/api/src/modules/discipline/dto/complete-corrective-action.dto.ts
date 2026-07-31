import { IsDateString } from 'class-validator';

export class CompleteCorrectiveActionDto {
  @IsDateString()
  completed_date: string;
}
