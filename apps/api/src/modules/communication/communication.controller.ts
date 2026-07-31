import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { CreateCircularDto } from './dto/create-circular.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('communication')
@ApiBearerAuth()
@Controller('circulars')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post()
  @Permissions({ module: 'communication', action: 'create' })
  create(@Body() dto: CreateCircularDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communicationService.create(dto, user.userId);
  }

  @Get()
  @Permissions({ module: 'communication', action: 'view' })
  findAllForTenant(@Query('tenantId') tenantId: string) {
    return this.communicationService.findAllForTenant(tenantId);
  }

  /**
   * Self-service, same shape as ExamsController's my-results — no
   * @Permissions() decorator (neither Student nor Parent has any
   * communication permission by design); the gate is the explicit
   * studentId/parentOfStudentIds checks below. Declared ABOVE ':id' per
   * this project's static-before-dynamic route convention.
   */
  @Get('my-circulars')
  findMyCirculars(@Query('studentId') studentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    if (user.studentId) {
      return this.communicationService.findForStudent(user.studentId);
    }

    if (user.parentOfStudentIds && user.parentOfStudentIds.length > 0) {
      if (!studentId) {
        throw new BadRequestException(
          'studentId query parameter is required for Parent accounts — specify which child.',
        );
      }
      if (!user.parentOfStudentIds.includes(studentId)) {
        throw new ForbiddenException('This student is not linked to your account.');
      }
      return this.communicationService.findForStudent(studentId);
    }

    throw new ForbiddenException('This endpoint is only available to Student or Parent accounts.');
  }

  @Post('my-circulars/:id/read')
  markMyCircularRead(
    @Param('id') id: string,
    @Query('studentId') studentId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.studentId) {
      return this.communicationService.markReadForStudent(id, user.studentId, user.userId);
    }

    if (user.parentOfStudentIds && user.parentOfStudentIds.length > 0) {
      if (!studentId) {
        throw new BadRequestException(
          'studentId query parameter is required for Parent accounts — specify which child.',
        );
      }
      if (!user.parentOfStudentIds.includes(studentId)) {
        throw new ForbiddenException('This student is not linked to your account.');
      }
      return this.communicationService.markReadForStudent(id, studentId, user.userId);
    }

    throw new ForbiddenException('This endpoint is only available to Student or Parent accounts.');
  }

  @Get(':id')
  @Permissions({ module: 'communication', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.communicationService.findOne(id);
  }

  @Post(':id/read')
  @Permissions({ module: 'communication', action: 'view' })
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.communicationService.markRead(id, user.userId);
  }

  @Get(':id/read-receipts')
  @Permissions({ module: 'communication', action: 'view' })
  getReadReceipts(@Param('id') id: string) {
    return this.communicationService.getReadReceipts(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissions({ module: 'communication', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.communicationService.remove(id);
  }
}
