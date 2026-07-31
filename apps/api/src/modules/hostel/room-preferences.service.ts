import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomPreference } from './entities/room-preference.entity';
import { Room } from './entities/room.entity';
import { RoomAllocation, RoomAllocationStatus } from './entities/room-allocation.entity';
import { CreateRoomPreferenceDto } from './dto/create-room-preference.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class RoomPreferencesService {
  constructor(
    @InjectRepository(RoomPreference) private readonly prefRepo: Repository<RoomPreference>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomAllocation) private readonly allocationRepo: Repository<RoomAllocation>,
  ) {}

  private repo(): Repository<RoomPreference> {
    return scopedRepo(this.prefRepo, RoomPreference);
  }
  private allocations(): Repository<RoomAllocation> {
    return scopedRepo(this.allocationRepo, RoomAllocation);
  }

  create(dto: CreateRoomPreferenceDto): Promise<RoomPreference> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<RoomPreference[]> {
    return this.repo().find({ where: { tenant_id: tenantId } });
  }

  async runMatching(tenantId: string): Promise<{ matched: number; unmatched: number }> {
    const prefs = await this.repo().find({ where: { tenant_id: tenantId } });
    const byStudent = new Map(prefs.map((p) => [p.student_id, p]));
    const matchedIds = new Set<string>();

    for (const p of prefs) {
      if (matchedIds.has(p.student_id) || !p.preferred_roommate_id) continue;
      const other = byStudent.get(p.preferred_roommate_id);
      if (other && other.preferred_roommate_id === p.student_id && !matchedIds.has(other.student_id)) {
        matchedIds.add(p.student_id);
        matchedIds.add(other.student_id);
      }
    }

    const remaining = prefs.filter((p) => !matchedIds.has(p.student_id));
    const byFloor = new Map<number, RoomPreference[]>();
    for (const p of remaining) {
      if (p.preferred_floor == null) continue;
      const list = byFloor.get(p.preferred_floor) ?? [];
      list.push(p);
      byFloor.set(p.preferred_floor, list);
    }
    for (const [, list] of byFloor) {
      for (let i = 0; i + 1 < list.length; i += 2) {
        matchedIds.add(list[i].student_id);
        matchedIds.add(list[i + 1].student_id);
      }
    }

    for (const studentId of matchedIds) {
      const pref = byStudent.get(studentId)!;
      const allocation = await this.allocations().findOne({
        where: { tenant_id: tenantId, student_id: studentId, status: RoomAllocationStatus.ACTIVE },
      });
      pref.matched_room_id = allocation?.room_id ?? undefined;
      await this.repo().save(pref);
    }

    return { matched: matchedIds.size, unmatched: prefs.length - matchedIds.size };
  }
}