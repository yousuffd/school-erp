import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('academic-years')
@ApiBearerAuth()
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @Permissions({ module: 'core-admin', action: 'create' })
  create(@Body() dto: CreateAcademicYearDto) {
    return this.academicYearsService.create(dto);
  }

  // No @Permissions() decorator on purpose — this is a read-only list of
  // academic years, relied on as basic UI chrome by every authenticated
  // role (TopBar's year selector, Teacher-facing Assignments/LMS/
  // Examinations views, the Student-side dashboard, etc.), not a Core
  // Admin action. "Which years exist and which is current" isn't
  // sensitive; only creating/editing years is, and those two routes stay
  // gated below.
  @Get()
  findAllForTenant(@Query('tenantId') tenantId: string) {
    return this.academicYearsService.findAllForTenant(tenantId);
  }

  @Patch(':id/set-current')
  @Permissions({ module: 'core-admin', action: 'edit' })
  setCurrent(@Param('id') id: string) {
    return this.academicYearsService.setCurrent(id);
  }
}