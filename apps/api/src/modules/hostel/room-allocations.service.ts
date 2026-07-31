import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomAllocation, RoomAllocationStatus } from './entities/room-allocation.entity';
import { Room } from './entities/room.entity';
import { CreateRoomAllocationDto } from './dto/create-room-allocation.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class RoomAllocationsService {
  constructor(
    @InjectRepository(RoomAllocation) private readonly allocationRepo: Repository<RoomAllocation>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
  ) {}

  private repo(): Repository<RoomAllocation> {
    return scopedRepo(this.allocationRepo, RoomAllocation);
  }
  private rooms(): Repository<Room> {
    return scopedRepo(this.roomRepo, Room);
  }

  async create(dto: CreateRoomAllocationDto): Promise<RoomAllocation> {
    const room = await this.rooms().findOne({ where: { id: dto.room_id } });
    if (!room) throw new NotFoundException(`Room ${dto.room_id} not found`);

    // A student can't hold two active allocations at once, in this room or
    // any other — surfaced during testing (a duplicate POST for the same
    // student silently consumed two of the room's slots instead of being
    // rejected). Checked before the capacity count below.
    const existingForStudent = await this.repo().findOne({
      where: { student_id: dto.student_id, status: RoomAllocationStatus.ACTIVE },
    });
    if (existingForStudent) {
      throw new BadRequestException(
        `Student already has an active room allocation (${existingForStudent.id}) — vacate it first`,
      );
    }

    const activeCount = await this.repo().count({
      where: { room_id: dto.room_id, status: RoomAllocationStatus.ACTIVE },
    });
    if (activeCount >= room.capacity) {
      throw new BadRequestException(
        `Room ${room.building_name} ${room.room_number} is at capacity (${room.capacity})`,
      );
    }

    return this.repo().save(this.repo().create({ ...dto, status: RoomAllocationStatus.ACTIVE }));
  }

  findAllForTenant(tenantId: string, filters?: { roomId?: string; studentId?: string; status?: RoomAllocationStatus }): Promise<RoomAllocation[]> {
    const where: any = { tenant_id: tenantId };
    if (filters?.roomId) where.room_id = filters.roomId;
    if (filters?.studentId) where.student_id = filters.studentId;
    if (filters?.status) where.status = filters.status;
    return this.repo().find({ where, order: { allocated_date: 'DESC' } });
  }

  async findOne(id: string): Promise<RoomAllocation> {
    const allocation = await this.repo().findOne({ where: { id } });
    if (!allocation) throw new NotFoundException(`Room allocation ${id} not found`);
    return allocation;
  }

  async vacate(id: string, vacatedDate: string): Promise<RoomAllocation> {
    const allocation = await this.findOne(id);
    allocation.status = RoomAllocationStatus.VACATED;
    allocation.vacated_date = vacatedDate;
    return this.repo().save(allocation);
  }
}