import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentTransportAssignment } from './entities/student-transport-assignment.entity';
import { RouteStop } from './entities/route-stop.entity';
import { CreateStudentTransportAssignmentDto } from './dto/create-student-transport-assignment.dto';
import { UpdateStudentTransportAssignmentDto } from './dto/update-student-transport-assignment.dto';
import { scopedRepo } from '../../common/context/tenant-context';

export interface StudentAssignmentQuery {
  routeId?: string;
  academicYearId?: string;
}

@Injectable()
export class StudentTransportAssignmentsService {
  constructor(
    @InjectRepository(StudentTransportAssignment)
    private readonly assignmentRepo: Repository<StudentTransportAssignment>,
    @InjectRepository(RouteStop) private readonly stopRepo: Repository<RouteStop>,
  ) {}

  private repo(): Repository<StudentTransportAssignment> {
    return scopedRepo(this.assignmentRepo, StudentTransportAssignment);
  }
  private stopsRepo(): Repository<RouteStop> {
    return scopedRepo(this.stopRepo, RouteStop);
  }

  private async assertStopBelongsToRoute(stopId: string, routeId: string): Promise<void> {
    const stop = await this.stopsRepo().findOne({ where: { id: stopId } });
    if (!stop || stop.route_id !== routeId) {
      throw new BadRequestException('The selected stop does not belong to the selected route.');
    }
  }

  async create(dto: CreateStudentTransportAssignmentDto): Promise<StudentTransportAssignment> {
    await this.assertStopBelongsToRoute(dto.stop_id, dto.route_id);
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, student_id: dto.student_id, academic_year_id: dto.academic_year_id },
    });
    if (existing) {
      throw new BadRequestException(
        'This student already has a transport assignment for this academic year — update it to reassign instead.',
      );
    }
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, filters?: StudentAssignmentQuery): Promise<StudentTransportAssignment[]> {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (filters?.routeId) where.route_id = filters.routeId;
    if (filters?.academicYearId) where.academic_year_id = filters.academicYearId;
    return this.repo().find({ where });
  }

  async findOne(id: string): Promise<StudentTransportAssignment> {
    const assignment = await this.repo().findOne({ where: { id } });
    if (!assignment) throw new NotFoundException(`Transport assignment ${id} not found`);
    return assignment;
  }

  /** Reassignment: only re-validates stop-belongs-to-route if either field is actually changing. */
  async update(id: string, dto: UpdateStudentTransportAssignmentDto): Promise<StudentTransportAssignment> {
    const assignment = await this.findOne(id);
    const routeId = dto.route_id ?? assignment.route_id;
    const stopId = dto.stop_id ?? assignment.stop_id;
    if (dto.route_id || dto.stop_id) {
      await this.assertStopBelongsToRoute(stopId, routeId);
    }
    Object.assign(assignment, dto);
    return this.repo().save(assignment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Transport assignment ${id} not found`);
  }
}
