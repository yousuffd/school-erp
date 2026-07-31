import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FullFinalSettlement, SettlementStatus } from './entities/full-final-settlement.entity';
import { CreateFullFinalSettlementDto } from './dto/create-full-final-settlement.dto';
import { EmployeesService } from '../hr-management/employees.service';
import { EmployeeStatus } from '../hr-management/entities/employee.entity';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class FullFinalSettlementsService {
  constructor(
    @InjectRepository(FullFinalSettlement) private readonly repoRaw: Repository<FullFinalSettlement>,
    private readonly employeesService: EmployeesService,
  ) {}

  private repo(): Repository<FullFinalSettlement> {
    return scopedRepo(this.repoRaw, FullFinalSettlement);
  }

  create(dto: CreateFullFinalSettlementDto): Promise<FullFinalSettlement> {
    const dues = Number(dto.dues ?? 0);
    const deductions = Number(dto.deductions ?? 0);
    return this.repo().save(
      this.repo().create({
        ...dto,
        dues: String(dues),
        deductions: String(deductions),
        net_settlement_amount: String(dues - deductions),
      }),
    );
  }

  findAllForTenant(tenantId: string): Promise<FullFinalSettlement[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { last_working_date: 'DESC' } });
  }

  async findOne(id: string): Promise<FullFinalSettlement> {
    const settlement = await this.repo().findOne({ where: { id } });
    if (!settlement) throw new NotFoundException(`Settlement ${id} not found`);
    return settlement;
  }

  /**
   * Marks the settlement processed AND flips the Employee's status to
   * terminated — the one place Payroll writes back into HR's Employee
   * table, matching the blueprint's declared dependency direction.
   */
  async process(id: string): Promise<FullFinalSettlement> {
    const settlement = await this.findOne(id);
    if (settlement.status !== SettlementStatus.PENDING) {
      throw new BadRequestException(`Settlement is already ${settlement.status}.`);
    }
    settlement.status = SettlementStatus.PROCESSED;
    await this.repo().save(settlement);
    await this.employeesService.update(settlement.employee_id, { status: EmployeeStatus.TERMINATED });
    return settlement;
  }
}