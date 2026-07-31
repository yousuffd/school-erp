import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class EmployeesService {
  constructor(@InjectRepository(Employee) private readonly repoRaw: Repository<Employee>) {}

  private repo(): Repository<Employee> {
    return scopedRepo(this.repoRaw, Employee);
  }

  create(dto: CreateEmployeeDto): Promise<Employee> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, department?: string): Promise<Employee[]> {
    const where: any = { tenant_id: tenantId };
    if (department) where.department = department;
    return this.repo().find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.repo().findOne({ where: { id } });
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);
    Object.assign(employee, dto);
    return this.repo().save(employee);
  }

  /**
   * Org-chart data — a simple flat list with manager_id, built into a tree
   * client-side (no new charting library needed). Not paginated; fine at
   * this project's scale, revisit if a tenant's staff count grows large.
   */
  findAllWithHierarchy(tenantId: string): Promise<Employee[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  /** Self-service — the logged-in user's own Employee record, if one exists. */
  async findByUserId(userId: string): Promise<Employee | null> {
    return this.repo().findOne({ where: { user_id: userId } });
  }
}