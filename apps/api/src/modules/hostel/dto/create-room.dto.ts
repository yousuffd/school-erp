import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  campus_id: string;

  @IsString()
  @MaxLength(100)
  building_name: string;

  @IsString()
  @MaxLength(20)
  room_number: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsEnum(RoomType)
  room_type?: RoomType;
}