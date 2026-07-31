import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Permissions({ module: 'academic-management', action: 'create' })
  create(@Body() dto: CreateSchoolClassDto) {
    return this.classesService.create(dto);
  }

  // Read-only reference data (class/section list, e.g. "Grade 6-B") needed
  // by any authenticated user rendering class names — Teacher (Diary
  // picker), Parent (Diary create + display), Student (display). Same
  // over-gating class of bug already fixed for academic-years/campuses;
  // write access (create, above) stays admin-gated.
  @Get()
  findAllForTenant(@Query('tenantId') tenantId: string, @Query('academicYearId') academicYearId?: string) {
    return this.classesService.findAllForTenant(tenantId, academicYearId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }
}
