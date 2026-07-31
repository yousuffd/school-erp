import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ParentStudentLinksService } from './parent-student-links.service';
import { CreateParentStudentLinkDto } from './dto/create-parent-student-link.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Admin-facing management of Parent-to-Student links, PLUS one
 * self-service route for a Parent to see which of their own children are
 * linked (needed so the frontend can show a Parent which studentId values
 * are valid before calling e.g. GET /exams/my-results?studentId=...).
 *
 * ASSUMPTION flagged for review: permission key deliberately reuses
 * 'student-lifecycle' rather than introducing a new module key, since this
 * is a sub-resource of Student Lifecycle (same conceptual home as the
 * existing guardian_* fields), not a distinct capability of its own.
 * Revisit if per-feature auditing on this specifically is ever needed.
 */
@ApiTags('parent-student-links')
@ApiBearerAuth()
@Controller('parent-student-links')
export class ParentStudentLinksController {
  constructor(private readonly linksService: ParentStudentLinksService) {}

  @Post()
  @Permissions({ module: 'student-lifecycle', action: 'create' })
  create(@Body() dto: CreateParentStudentLinkDto) {
    return this.linksService.create(dto);
  }

  @Get('by-parent/:parentUserId')
  @Permissions({ module: 'student-lifecycle', action: 'view' })
  findForParent(@Param('parentUserId') parentUserId: string, @Query('tenantId') tenantId: string) {
    return this.linksService.findForParent(tenantId, parentUserId);
  }

  @Get('by-student/:studentId')
  @Permissions({ module: 'student-lifecycle', action: 'view' })
  findForStudent(@Param('studentId') studentId: string, @Query('tenantId') tenantId: string) {
    return this.linksService.findForStudent(tenantId, studentId);
  }

  /**
   * Self-service — a Parent seeing which of their own children are
   * linked. No @Permissions() decorator, same pattern as every other
   * self-service route in this project (e.g. Assignments' /mine).
   */
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.linksService.findForParent(user.tenantId, user.userId);
  }

  @Delete(':id')
  @Permissions({ module: 'student-lifecycle', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.linksService.remove(id);
  }
}
