import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
    @InjectRepository(RouteStop) private readonly stopRepo: Repository<RouteStop>,
  ) {}

  private repo(): Repository<Route> {
    return scopedRepo(this.routeRepo, Route);
  }
  private stopsRepo(): Repository<RouteStop> {
    return scopedRepo(this.stopRepo, RouteStop);
  }

  create(dto: CreateRouteDto): Promise<Route> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<Route[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Route & { stops: RouteStop[] }> {
    const route = await this.repo().findOne({ where: { id } });
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    const stops = await this.stopsRepo().find({ where: { route_id: id }, order: { sequence_order: 'ASC' } });
    return { ...route, stops };
  }

  async update(id: string, dto: UpdateRouteDto): Promise<Route> {
    const route = await this.repo().findOne({ where: { id } });
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    Object.assign(route, dto);
    return this.repo().save(route);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Route ${id} not found`);
  }

  // --- Stops ---

  async addStop(dto: CreateRouteStopDto): Promise<RouteStop> {
    const route = await this.repo().findOne({ where: { id: dto.route_id } });
    if (!route) throw new NotFoundException(`Route ${dto.route_id} not found`);
    const clash = await this.stopsRepo().findOne({
      where: { tenant_id: dto.tenant_id, route_id: dto.route_id, sequence_order: dto.sequence_order },
    });
    if (clash) {
      throw new BadRequestException(
        `Stop sequence ${dto.sequence_order} is already used on this route (${clash.name}).`,
      );
    }
    return this.stopsRepo().save(this.stopsRepo().create(dto));
  }

  findStopsForRoute(routeId: string): Promise<RouteStop[]> {
    return this.stopsRepo().find({ where: { route_id: routeId }, order: { sequence_order: 'ASC' } });
  }

  async removeStop(id: string): Promise<void> {
    const result = await this.stopsRepo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Stop ${id} not found`);
  }
}
