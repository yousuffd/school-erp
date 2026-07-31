import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniProfile } from './entities/alumni-profile.entity';
import { CreateAlumniProfileDto } from './dto/create-alumni-profile.dto';
import { UpdateAlumniProfileDto } from './dto/update-alumni-profile.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { StudentLifecycleStatus } from '../students/entities/student.entity';

@Injectable()
export class AlumniProfilesService {
  constructor(
    @InjectRepository(AlumniProfile) private readonly repo_: Repository<AlumniProfile>,
    private readonly studentsService: StudentsService,
  ) {}

  private repo(): Repository<AlumniProfile> {
    return scopedRepo(this.repo_, AlumniProfile);
  }

  /**
   * Hard block (not a warning) — a real, pre-existing gap closed here:
   * this previously accepted a profile for ANY student regardless of
   * lifecycle status. Surfaced originally because Greenwood's seed data
   * (Grades 1-5, a K-12 school) has no alumni-status students yet to test
   * against — confirmed via a direct status check now, not just assumed.
   * Admin-only access (no self-service anywhere in this module) was
   * already correct and needed no change.
   */
  async create(dto: CreateAlumniProfileDto): Promise<AlumniProfile> {
    const student = await this.studentsService.findOne(dto.student_id);
    if (student.status !== StudentLifecycleStatus.ALUMNI) {
      throw new ConflictException(
        `Student '${student.first_name} ${student.last_name}' has status '${student.status}', not 'alumni' — update the student's status before creating an alumni profile.`,
      );
    }
    const existing = await this.repo().findOne({ where: { student_id: dto.student_id } });
    if (existing) throw new ConflictException('This student already has an alumni profile');
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<AlumniProfile[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { graduation_year: 'DESC' } });
  }

  async findOne(id: string): Promise<AlumniProfile> {
    const profile = await this.repo().findOne({ where: { id } });
    if (!profile) throw new NotFoundException(`Alumni profile ${id} not found`);
    return profile;
  }

  async update(id: string, dto: UpdateAlumniProfileDto): Promise<AlumniProfile> {
    const profile = await this.findOne(id);
    Object.assign(profile, dto);
    return this.repo().save(profile);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Alumni profile ${id} not found`);
  }
}
