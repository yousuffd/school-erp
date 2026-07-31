import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityRoster } from './entities/activity-roster.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AddToRosterDto } from './dto/add-to-roster.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityRoster) private readonly rosterRepo: Repository<ActivityRoster>,
  ) {}

  private repo(): Repository<Activity> {
    return scopedRepo(this.activityRepo, Activity);
  }

  private rosters(): Repository<ActivityRoster> {
    return scopedRepo(this.rosterRepo, ActivityRoster);
  }

  create(dto: CreateActivityDto): Promise<Activity> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<Activity[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.repo().findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const activity = await this.findOne(id);
    Object.assign(activity, dto);
    return this.repo().save(activity);
  }

  /** Guarded — refuses if the activity still has roster members or linked events. */
  async remove(id: string): Promise<void> {
    const rosterCount = await this.rosters().count({ where: { activity_id: id } });
    if (rosterCount > 0) {
      throw new BadRequestException(
        `Cannot delete an activity with ${rosterCount} roster member(s). Remove them from the roster first.`,
      );
    }
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Activity ${id} not found`);
  }

  async addToRoster(activityId: string, dto: AddToRosterDto): Promise<ActivityRoster> {
    const existing = await this.rosters().findOne({
      where: { activity_id: activityId, student_id: dto.student_id },
    });
    if (existing) throw new ConflictException('This student is already on this activity\'s roster');
    return this.rosters().save(
      this.rosters().create({ ...dto, activity_id: activityId }),
    );
  }

  findRoster(activityId: string): Promise<ActivityRoster[]> {
    return this.rosters().find({ where: { activity_id: activityId }, order: { joined_date: 'ASC' } });
  }

  findRosterForStudent(studentId: string): Promise<ActivityRoster[]> {
    return this.rosters().find({ where: { student_id: studentId } });
  }

  async removeFromRoster(id: string): Promise<void> {
    const result = await this.rosters().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Roster entry ${id} not found`);
  }
}
