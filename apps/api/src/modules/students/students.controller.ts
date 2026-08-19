import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ChangeStudentStatusDto } from './dto/change-student-status.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Permissions({ module: 'student-lifecycle', action: 'create' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Permissions({ module: 'student-lifecycle', action: 'view' })
  findAllForTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Query('campusId') campusId?: string,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('schoolClassId') schoolClassId?: string,
  ) {
    return this.studentsService.findAllForTenant(user.tenantId, { campusId, gradeLevel, status, search, schoolClassId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const hasStaffAccess = (user.permissions ?? []).some(
      (p) => p.module === 'student-lifecycle' && p.action === 'view',
    );
    const isOwnRecord = user.studentId === id;
    const isLinkedChild = user.parentOfStudentIds?.includes(id) ?? false;

    if (!hasStaffAccess && !isOwnRecord && !isLinkedChild) {
      throw new ForbiddenException('You do not have access to this student record.');
    }
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions({ module: 'student-lifecycle', action: 'edit' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions({ module: 'student-lifecycle', action: 'edit' })
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStudentStatusDto) {
    return this.studentsService.changeStatus(id, dto);
  }

  @Patch(':id/class')
  @Permissions({ module: 'student-lifecycle', action: 'edit' })
  assignClass(@Param('id') id: string, @Body() dto: AssignClassDto) {
    return this.studentsService.assignClass(id, dto);
  }
}
