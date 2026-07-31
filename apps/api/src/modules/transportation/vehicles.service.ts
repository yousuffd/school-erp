import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>) {}

  private repo(): Repository<Vehicle> {
    return scopedRepo(this.vehicleRepo, Vehicle);
  }

  create(dto: CreateVehicleDto): Promise<Vehicle> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<Vehicle[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { registration_number: 'ASC' } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.repo().findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, dto);
    return this.repo().save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Vehicle ${id} not found`);
  }
}
