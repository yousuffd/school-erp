import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EventType } from '../entities/event.entity';

export class CreateEventDto {
  @IsUUID()
  tenant_id: string;

  @IsOptional()
  @IsUUID()
  activity_id?: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsEnum(EventType)
  event_type: EventType;

  @IsDateString()
  event_date: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  opponent_name?: string;
}
