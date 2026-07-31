import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeeAssignmentsService } from './fee-assignments.service';
import { AssignFeeDto } from './dto/assign-fee.dto';
import { BulkAssignFeeDto } from './dto/bulk-assign-fee.dto';
import { SetTransportPreferenceDto } from './dto/set-transport-preference.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('fee-assignments')
@ApiBearerAuth()
@Controller('fee-assignments')
export class FeeAssignmentsController {
  constructor(private readonly feeAssignmentsService: FeeAssignmentsService) {}

  @Post()
  @Permissions({ module: 'fee-management', action: 'create' })
  assign(@Body() dto: AssignFeeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.feeAssignmentsService.assign(user.tenantId, dto);
  }

  @Post('bulk')
  @Permissions({ module: 'fee-management', action: 'create' })
  bulkAssign(@Body() dto: BulkAssignFeeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.feeAssignmentsService.bulkAssign(user.tenantId, dto);
  }

  @Get('by-student/:studentId')
  @Permissions({ module: 'fee-management', action: 'view' })
  findForStudent(@Param('studentId') studentId: string) {
    return this.feeAssignmentsService.findForStudent(studentId);
  }

  @Get(':id/balance')
  @Permissions({ module: 'fee-management', action: 'view' })
  getBalance(@Param('id') id: string) {
    return this.feeAssignmentsService.getBalance(id);
  }

  /**
   * Self-service, Parent only (Student explicitly excluded — a deliberate
   * deviation from this project's usual Student-inclusive self-service
   * pattern. Teacher access was built, tested, and then explicitly reversed
   * by direct request). No @Permissions() decorator; the gate is
   * assertParentFeeAccess inside the service.
   */
  @Get('my-access/by-student/:studentId')
  findForStudentSelfService(@Param('studentId') studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.feeAssignmentsService.findForStudentSelfService(user, studentId);
  }

  @Get('my-access/balance/:assignmentId')
  getBalanceSelfService(@Param('assignmentId') assignmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.feeAssignmentsService.getBalanceSelfService(user, assignmentId);
  }

  /**
   * Parent self-service — opt a linked child in/out of transport for the
   * current academic year. No @Permissions() decorator, same convention
   * as the other my-access routes; the real gate is assertParentFeeAccess
   * inside the service.
   */
  @Patch('my-access/transport-preference/:studentId')
  setTransportPreference(
    @Param('studentId') studentId: string,
    @Body() dto: SetTransportPreferenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.feeAssignmentsService.setTransportPreference(user, studentId, dto.wantsTransport);
  }
}
