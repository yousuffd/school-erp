import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeeAdjustmentsService } from './fee-adjustments.service';
import { CreateFeeAdjustmentDto } from './dto/create-fee-adjustment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('fee-adjustments')
@ApiBearerAuth()
@Controller('fee-adjustments')
export class FeeAdjustmentsController {
  constructor(private readonly feeAdjustmentsService: FeeAdjustmentsService) {}

  @Post()
  @Permissions({ module: 'fee-management', action: 'edit' })
  create(@Body() dto: CreateFeeAdjustmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.feeAdjustmentsService.create(user.tenantId, dto, user.userId);
  }

  @Get('by-assignment/:assignmentId')
  @Permissions({ module: 'fee-management', action: 'view' })
  findForAssignment(@Param('assignmentId') assignmentId: string) {
    return this.feeAdjustmentsService.findForAssignment(assignmentId);
  }
}
