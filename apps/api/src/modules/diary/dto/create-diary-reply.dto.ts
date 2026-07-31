import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDiaryReplyDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
