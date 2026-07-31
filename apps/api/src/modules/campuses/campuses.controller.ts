import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CampusesService } from './campuses.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('campuses')
@ApiBearerAuth()
@Controller('campuses')
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @Post()
  @Permissions({ module: 'core-admin', action: 'create' })
  create(@Body() dto: CreateCampusDto) {
    return this.campusesService.create(dto);
  }

  @Get()
  findAllForTenant(@Query('tenantId') tenantId: string) {
    return this.campusesService.findAllForTenant(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campusesService.findOne(id);
  }
}
