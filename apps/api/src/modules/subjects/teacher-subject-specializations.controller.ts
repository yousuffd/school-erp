import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeacherSubjectSpecializationsService } from './teacher-subject-specializations.service';
import { AssignTeacherSpecializationDto } from './dto/assign-teacher-specialization.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('teacher-subject-specializations')
@ApiBearerAuth()
@Controller('teacher-subject-specializations')
export class TeacherSubjectSpecializationsController {
  constructor(private readonly specializationsService: TeacherSubjectSpecializationsService) {}

  @Post()
  @Permissions({ module: 'academic-management', action: 'edit' })
  assign(@Body() dto: AssignTeacherSpecializationDto) {
    return this.specializationsService.assign(dto);
  }

  @Get()
  @Permissions({ module: 'academic-management', action: 'view' })
  findAll(@Query('tenantId') tenantId: string) {
    return this.specializationsService.findAllForTenant(tenantId);
  }

  @Get('by-subject/:subjectId')
  @Permissions({ module: 'academic-management', action: 'view' })
  findBySubject(@Query('tenantId') tenantId: string, @Param('subjectId') subjectId: string) {
    return this.specializationsService.findBySubject(tenantId, subjectId);
  }

  @Get('by-teacher/:teacherId')
  @Permissions({ module: 'academic-management', action: 'view' })
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.specializationsService.findByTeacher(teacherId);
  }

  @Delete(':id')
  @Permissions({ module: 'academic-management', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.specializationsService.remove(id);
  }
}