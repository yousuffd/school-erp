import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  building_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  room_number?: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(RoomType)
  room_type?: RoomType;
}