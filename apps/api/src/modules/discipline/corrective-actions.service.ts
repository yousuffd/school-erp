import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorrectiveAction, CorrectiveActionStatus } from './entities/corrective-action.entity';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { CompleteCorrectiveActionDto } from './dto/complete-corrective-action.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class CorrectiveActionsService {
  constructor(@InjectRepository(CorrectiveAction) private readonly actionRepo: Repository<CorrectiveAction>) {}

  private repo(): Repository<CorrectiveAction> {
    return scopedRepo(this.actionRepo, CorrectiveAction);
  }

  create(incidentId: string, dto: CreateCorrectiveActionDto): Promise<CorrectiveAction> {
    return this.repo().save(this.repo().create({ ...dto, incident_id: incidentId }));
  }

  findForIncident(incidentId: string): Promise<CorrectiveAction[]> {
    return this.repo().find({ where: { incident_id: incidentId }, order: { due_date: 'ASC' } });
  }

  async complete(id: string, dto: CompleteCorrectiveActionDto): Promise<CorrectiveAction> {
    const action = await this.repo().findOne({ where: { id } });
    if (!action) throw new NotFoundException(`Corrective action ${id} not found`);
    action.completed_date = dto.completed_date;
    action.status = CorrectiveActionStatus.COMPLETED;
    return this.repo().save(action);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Corrective action ${id} not found`);
  }
}
