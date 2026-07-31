import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryStructure } from './entities/salary-structure.entity';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class SalaryStructuresService {
  constructor(@InjectRepository(SalaryStructure) private readonly repoRaw: Repository<SalaryStructure>) {}

  private repo(): Repository<SalaryStructure> {
    return scopedRepo(this.repoRaw, SalaryStructure);
  }

  create(dto: CreateSalaryStructureDto): Promise<SalaryStructure> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForEmployee(employeeId: string): Promise<SalaryStructure[]> {
    return this.repo().find({ where: { employee_id: employeeId }, order: { effective_from: 'DESC' } });
  }

  /**
   * Resolves the structure actually in effect for a given date — the
   * latest row whose effective_from is <= asOfDate. Used by PayrollRunsService
   * when processing a run; not a DB constraint since multiple structures per
   * employee (salary history) is the whole point.
   */
  async findCurrentForEmployee(employeeId: string, asOfDate: string): Promise<SalaryStructure | null> {
    return this.repo()
      .createQueryBuilder('s')
      .where('s.employee_id = :employeeId', { employeeId })
      .andWhere('s.effective_from <= :asOfDate', { asOfDate })
      .orderBy('s.effective_from', 'DESC')
      .getOne();
  }
}