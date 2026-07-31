import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniEvent } from './entities/alumni-event.entity';
import { AlumniEventRegistration } from './entities/alumni-event-registration.entity';
import { CreateAlumniEventDto } from './dto/create-alumni-event.dto';
import { RegisterForAlumniEventDto } from './dto/register-for-alumni-event.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class AlumniEventsService {
  constructor(
    @InjectRepository(AlumniEvent) private readonly eventRepo: Repository<AlumniEvent>,
    @InjectRepository(AlumniEventRegistration) private readonly regRepo: Repository<AlumniEventRegistration>,
  ) {}

  private events(): Repository<AlumniEvent> {
    return scopedRepo(this.eventRepo, AlumniEvent);
  }
  private regs(): Repository<AlumniEventRegistration> {
    return scopedRepo(this.regRepo, AlumniEventRegistration);
  }

  create(dto: CreateAlumniEventDto): Promise<AlumniEvent> {
    return this.events().save(this.events().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<AlumniEvent[]> {
    return this.events().find({ where: { tenant_id: tenantId }, order: { event_date: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    const result = await this.events().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Alumni event ${id} not found`);
  }

  async register(eventId: string, dto: RegisterForAlumniEventDto): Promise<AlumniEventRegistration> {
    const existing = await this.regs().findOne({ where: { event_id: eventId, alumni_id: dto.alumni_id } });
    if (existing) throw new ConflictException('This alumnus is already registered for this event');
    return this.regs().save(this.regs().create({ ...dto, event_id: eventId }));
  }

  findRegistrations(eventId: string): Promise<AlumniEventRegistration[]> {
    return this.regs().find({ where: { event_id: eventId } });
  }
}
