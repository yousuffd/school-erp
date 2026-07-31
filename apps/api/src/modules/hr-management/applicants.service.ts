import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant, ApplicantStage } from './entities/applicant.entity';
import { Employee } from './entities/employee.entity';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantStageDto } from './dto/update-applicant-stage.dto';
import { HireApplicantDto } from './dto/hire-applicant.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class ApplicantsService {
  constructor(
    @InjectRepository(Applicant) private readonly applicantRepo: Repository<Applicant>,
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
  ) {}

  private repo(): Repository<Applicant> {
    return scopedRepo(this.applicantRepo, Applicant);
  }
  private employees(): Repository<Employee> {
    return scopedRepo(this.employeeRepo, Employee);
  }

  create(dto: CreateApplicantDto): Promise<Applicant> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, jobOpeningId?: string): Promise<Applicant[]> {
    const where: any = { tenant_id: tenantId };
    if (jobOpeningId) where.job_opening_id = jobOpeningId;
    return this.repo().find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Applicant> {
    const applicant = await this.repo().findOne({ where: { id } });
    if (!applicant) throw new NotFoundException(`Applicant ${id} not found`);
    return applicant;
  }

  async updateStage(id: string, dto: UpdateApplicantStageDto): Promise<Applicant> {
    const applicant = await this.findOne(id);
    if (dto.stage === ApplicantStage.HIRED) {
      throw new BadRequestException('Use POST /hr-management/applicants/:id/hire to hire — it creates the Employee record too.');
    }
    applicant.stage = dto.stage;
    return this.repo().save(applicant);
  }

  async hire(id: string, dto: HireApplicantDto): Promise<{ applicant: Applicant; employee: Employee }> {
    const applicant = await this.findOne(id);
    if (applicant.stage === ApplicantStage.HIRED) {
      throw new BadRequestException('This applicant has already been hired.');
    }

    const employee = await this.employees().save(
      this.employees().create({
        tenant_id: applicant.tenant_id,
        name: applicant.name,
        email: applicant.email,
        department: dto.department,
        designation: dto.designation,
        employment_type: dto.employment_type,
        date_of_joining: dto.date_of_joining,
        manager_id: dto.manager_id,
        base_salary: dto.base_salary,
      }),
    );

    applicant.stage = ApplicantStage.HIRED;
    await this.repo().save(applicant);

    return { applicant, employee };
  }
}