import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campus } from './entities/campus.entity';
import { CreateCampusDto } from './dto/create-campus.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class CampusesService {
  constructor(@InjectRepository(Campus) private readonly campusRepo: Repository<Campus>) {}

  private repo(): Repository<Campus> {
    return scopedRepo(this.campusRepo, Campus);
  }

  create(dto: CreateCampusDto): Promise<Campus> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<Campus[]> {
    return this.repo().find({ where: { tenant_id: tenantId } });
  }

  async findOne(id: string): Promise<Campus> {
    const campus = await this.repo().findOne({ where: { id } });
    if (!campus) throw new NotFoundException(`Campus ${id} not found`);
    return campus;
  }
}
