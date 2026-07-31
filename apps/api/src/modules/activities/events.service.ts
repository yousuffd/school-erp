import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventType } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { RecordFixtureResultDto } from './dto/record-fixture-result.dto';
import { RegisterForEventDto } from './dto/register-for-event.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventRegistration) private readonly registrationRepo: Repository<EventRegistration>,
  ) {}

  private repo(): Repository<Event> {
    return scopedRepo(this.eventRepo, Event);
  }

  private registrations(): Repository<EventRegistration> {
    return scopedRepo(this.registrationRepo, EventRegistration);
  }

  create(dto: CreateEventDto): Promise<Event> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, dateFrom?: string, dateTo?: string): Promise<Event[]> {
    const qb = this.repo().createQueryBuilder('e').where('e.tenant_id = :tenantId', { tenantId });
    if (dateFrom) qb.andWhere('e.event_date >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('e.event_date <= :dateTo', { dateTo });
    return qb.orderBy('e.event_date', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.repo().findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Event ${id} not found`);
  }

  /** Only meaningful for event_type = FIXTURE — checked explicitly, not silently ignored. */
  async recordFixtureResult(id: string, dto: RecordFixtureResultDto): Promise<Event> {
    const event = await this.findOne(id);
    if (event.event_type !== EventType.FIXTURE) {
      throw new BadRequestException('Fixture results can only be recorded on events of type "fixture"');
    }
    event.our_score = dto.our_score;
    event.opponent_score = dto.opponent_score;
    event.result = dto.result;
    return this.repo().save(event);
  }

  async register(eventId: string, dto: RegisterForEventDto): Promise<EventRegistration> {
    const existing = await this.registrations().findOne({
      where: { event_id: eventId, student_id: dto.student_id },
    });
    if (existing) throw new ConflictException('This student is already registered for this event');
    return this.registrations().save(
      this.registrations().create({ ...dto, event_id: eventId }),
    );
  }

  findRegistrations(eventId: string): Promise<EventRegistration[]> {
    return this.registrations().find({ where: { event_id: eventId } });
  }

  findRegistrationsForStudent(studentId: string): Promise<EventRegistration[]> {
    return this.registrations().find({ where: { student_id: studentId } });
  }

  async unregister(id: string): Promise<void> {
    const result = await this.registrations().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Registration ${id} not found`);
  }
}
