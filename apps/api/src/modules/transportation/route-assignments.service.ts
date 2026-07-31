import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteAssignment } from './entities/route-assignment.entity';
import { CreateRouteAssignmentDto } from './dto/create-route-assignment.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class RouteAssignmentsService {
  constructor(
    @InjectRepository(RouteAssignment) private readonly assignmentRepo: Repository<RouteAssignment>,
  ) {}

  private repo(): Repository<RouteAssignment> {
    return scopedRepo(this.assignmentRepo, RouteAssignment);
  }

  /**
   * One active assignment per (route, academic_year) — the DB unique index
   * is the real guarantee (see CreateTransportationTables migration); this
   * existence check just surfaces a clear 409 instead of a raw
   * constraint-violation error reaching the UI.
   *
   * Additionally, a vehicle or driver can only cover one route per academic
   * year — nothing in the schema enforces this (the unique index is keyed
   * on route, not vehicle/driver), so it's checked explicitly here. Without
   * it, the same driver/vehicle could silently be double-booked across
   * routes with no error at all.
   */
  async create(dto: CreateRouteAssignmentDto): Promise<RouteAssignment> {
    const existingForRoute = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, route_id: dto.route_id, academic_year_id: dto.academic_year_id },
    });
    if (existingForRoute) {
      throw new ConflictException(
        'This route already has a vehicle/driver assigned for this academic year. Remove the existing assignment first.',
      );
    }

    const existingForVehicle = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, vehicle_id: dto.vehicle_id, academic_year_id: dto.academic_year_id },
    });
    if (existingForVehicle) {
      throw new ConflictException(
        'This vehicle is already assigned to another route for this academic year.',
      );
    }

    const existingForDriver = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, driver_id: dto.driver_id, academic_year_id: dto.academic_year_id },
    });
    if (existingForDriver) {
      throw new ConflictException(
        'This driver is already assigned to another route for this academic year.',
      );
    }

    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, academicYearId?: string): Promise<RouteAssignment[]> {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (academicYearId) where.academic_year_id = academicYearId;
    return this.repo().find({ where });
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Route assignment ${id} not found`);
  }
}
