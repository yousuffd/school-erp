import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudentElectiveSelectionsService } from './student-elective-selections.service';
import { SelectElectiveDto } from './dto/select-elective.dto';
import { AdminSetElectiveSelectionDto } from './dto/admin-set-elective-selection.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('student-elective-selections')
@ApiBearerAuth()
@Controller('student-elective-selections')
export class StudentElectiveSelectionsController {
  constructor(private readonly selectionsService: StudentElectiveSelectionsService) {}

  /** Self-service — no @Permissions() gate, same pattern as every other /mine route. */
  @Post('mine')
  selectMine(@Body() dto: SelectElectiveDto, @CurrentUser() user: AuthenticatedUser) {
    return this.selectionsService.selectMine(user, dto);
  }

  /** Self-service. */
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.selectionsService.findMine(user);
  }

  /**
   * No longer takes an academicYearId param — a selection is now a
   * permanent, once-made choice (see the service's findExistingInGroup
   * doc comment), so a class roster's selections aren't scoped to any
   * particular year.
   */
  @Get()
  @Permissions({ module: 'academic-management', action: 'view' })
  findForClass(@Query('tenantId') tenantId: string, @Query('schoolClassId') schoolClassId: string) {
    return this.selectionsService.findForClass(tenantId, schoolClassId);
  }

  /** Admin override — bypasses the self-service lock-in. */
  @Post('admin')
  @Permissions({ module: 'academic-management', action: 'edit' })
  adminSet(@Body() dto: AdminSetElectiveSelectionDto) {
    return this.selectionsService.adminSet(dto);
  }
}