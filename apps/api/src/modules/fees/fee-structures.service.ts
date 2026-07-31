import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeComponent } from './entities/fee-component.entity';
import { FeeInstallment } from './entities/fee-installment.entity';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class FeeStructuresService {
  constructor(
    @InjectRepository(FeeStructure) private readonly structureRepo: Repository<FeeStructure>,
    @InjectRepository(FeeComponent) private readonly componentRepo: Repository<FeeComponent>,
    @InjectRepository(FeeInstallment) private readonly installmentRepo: Repository<FeeInstallment>,
  ) {}

  private repo(): Repository<FeeStructure> {
    return scopedRepo(this.structureRepo, FeeStructure);
  }
  private componentsRepo(): Repository<FeeComponent> {
    return scopedRepo(this.componentRepo, FeeComponent);
  }
  private installmentsRepo(): Repository<FeeInstallment> {
    return scopedRepo(this.installmentRepo, FeeInstallment);
  }

  /**
   * Creates a structure with its components and installments together, and
   * enforces the one real business rule here: the installment plan must add
   * up to the same total as the fee components. A plan that doesn't sum
   * correctly would silently under- or over-charge every student it's
   * assigned to — worth catching at creation time, not discovered later per
   * student.
   */
  async create(dto: CreateFeeStructureDto): Promise<FeeStructure> {
    const componentTotal = dto.components.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const installmentTotal = dto.installments.reduce((sum, i) => sum + parseFloat(i.amount), 0);

    if (Math.abs(componentTotal - installmentTotal) > 0.01) {
      throw new BadRequestException(
        `Installment plan (${installmentTotal.toFixed(2)}) must add up to the same total as the fee components (${componentTotal.toFixed(2)}).`,
      );
    }

    const structure = await this.repo().save(
      this.repo().create({
        tenant_id: dto.tenant_id,
        academic_year_id: dto.academic_year_id,
        grade_level: dto.grade_level,
        name: dto.name,
      }),
    );

    await this.componentsRepo().save(
      dto.components.map((c) => this.componentsRepo().create({ ...c, fee_structure_id: structure.id })),
    );
    await this.installmentsRepo().save(
      dto.installments.map((i) => this.installmentsRepo().create({ ...i, fee_structure_id: structure.id })),
    );

    return this.findOne(structure.id);
  }

  async findAllForTenant(tenantId: string, gradeLevel?: string): Promise<FeeStructure[]> {
    return this.repo().find({
      where: gradeLevel ? { tenant_id: tenantId, grade_level: gradeLevel } : { tenant_id: tenantId },
      relations: ['components', 'installments'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FeeStructure> {
    const structure = await this.repo().findOne({ where: { id }, relations: ['components', 'installments'] });
    if (!structure) throw new NotFoundException(`Fee structure ${id} not found`);
    return structure;
  }
}
