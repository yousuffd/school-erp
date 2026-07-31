import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class DriversService {
  constructor(@InjectRepository(Driver) private readonly driverRepo: Repository<Driver>) {}

  private repo(): Repository<Driver> {
    return scopedRepo(this.driverRepo, Driver);
  }

  create(dto: CreateDriverDto): Promise<Driver> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<Driver[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.repo().findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver ${id} not found`);
    return driver;
  }

  async update(id: string, dto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findOne(id);
    Object.assign(driver, dto);
    return this.repo().save(driver);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Driver ${id} not found`);
  }
}
