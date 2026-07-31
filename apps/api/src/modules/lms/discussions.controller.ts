import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DiscussionsService } from './discussions.service';
import { CreateDiscussionThreadDto, CreateDiscussionPostDto } from './dto/discussion.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('discussion-threads')
@ApiBearerAuth()
@Controller('discussion-threads')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  /**
   * Teacher-class-AND-subject-scoped: a teacher may only start a thread
   * for a class+subject combination they're actually timetabled to teach
   * (see DiscussionsService.createThread). Previously had no ownership
   * check at all beyond the lms:create permission gate.
   */
  @Post()
  @Permissions({ module: 'lms', action: 'create' })
  createThread(@Body() dto: CreateDiscussionThreadDto, @CurrentUser() user: AuthenticatedUser) {
    return this.discussionsService.createThread(dto, user.userId);
  }

  /**
   * Teacher-class-AND-subject-scoped this session: previously had no
   * @CurrentUser() at all, so no per-teacher filtering was possible — any
   * staff with lms:view saw every thread tenant-wide.
   */
  @Get()
  @Permissions({ module: 'lms', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('schoolClassId') schoolClassId: string | undefined,
    @Query('subjectId') subjectId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.findAllForTenant(tenantId, { schoolClassId, subjectId }, user.userId);
  }

  /** Self-service — no @Permissions() decorator. */
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.discussionsService.findForStudent(user);
  }

  /**
   * No @Permissions() decorator on either of these two — dual staff-OR-
   * own-class-student authorization happens inside the service via
   * assertClassAccess, since both roles legitimately read/post here, PLUS
   * a teacher-class-AND-subject layer on the staff branch this session
   * (see the service's doc comments — createPost in particular is
   * genuinely dual-use, unlike the other 3 LMS controllers' create()).
   */
  @Get(':id/posts')
  findPosts(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.discussionsService.findPosts(id, user);
  }

  @Post(':id/posts')
  createPost(@Param('id') id: string, @Body() dto: CreateDiscussionPostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.discussionsService.createPost(id, dto, user);
  }

  /**
   * Teacher-class-AND-subject-scoped this session: previously had no
   * ownership check at all beyond the lms:delete permission gate, and
   * didn't even verify the thread existed before attempting delete.
   */
  @Delete(':id')
  @Permissions({ module: 'lms', action: 'delete' })
  removeThread(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.discussionsService.removeThread(id, user);
  }
}