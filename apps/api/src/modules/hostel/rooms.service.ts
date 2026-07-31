import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class RoomsService {
  constructor(@InjectRepository(Room) private readonly roomRepo: Repository<Room>) {}

  private repo(): Repository<Room> {
    return scopedRepo(this.roomRepo, Room);
  }

  create(dto: CreateRoomDto): Promise<Room> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, campusId?: string): Promise<Room[]> {
    const where: any = { tenant_id: tenantId };
    if (campusId) where.campus_id = campusId;
    return this.repo().find({ where, order: { building_name: 'ASC', room_number: 'ASC' } });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.repo().findOne({ where: { id } });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return this.repo().save(room);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Room ${id} not found`);
  }
}