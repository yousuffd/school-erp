import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Permissions({ module: 'lms', action: 'create' })
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assignmentsService.create(dto, user.userId);
  }

  @Get()
  @Permissions({ module: 'lms', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('schoolClassId') schoolClassId: string | undefined,
    @Query('subjectId') subjectId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.findAllForTenant(tenantId, { schoolClassId, subjectId }, user.userId);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    if (!user.studentId) {
      throw new ForbiddenException('This account is not linked to a student record.');
    }
    return this.assignmentsService.findForStudent(user.tenantId, user.studentId);
  }

  @Get(':id')
  @Permissions({ module: 'lms', action: 'view' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.assignmentsService.findOne(id, user.userId);
  }

  @Delete(':id')
  @Permissions({ module: 'lms', action: 'delete' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.assignmentsService.remove(id, user.userId);
  }
}