import { Body, Controller, Delete, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { LecturesService } from './lectures.service';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { lectureUploadOptions } from './config/lecture-upload.config';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('lectures')
@ApiBearerAuth()
@Controller('lectures')
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  /**
   * Teacher-class-AND-subject-scoped: a teacher may only upload a lecture
   * for a class+subject combination they're actually timetabled to teach
   * (see LecturesService.create). Previously had no ownership check at
   * all beyond the lms:create permission gate.
   */
  @Post()
  @ApiConsumes('multipart/form-data')
  @Permissions({ module: 'lms', action: 'create' })
  @UseInterceptors(FileInterceptor('file', lectureUploadOptions))
  create(
    @Body() dto: CreateLectureDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lecturesService.create(dto, file, user.userId);
  }

  /**
   * Teacher-class-AND-subject-scoped this session: previously had no
   * @CurrentUser() at all, so no per-teacher filtering was possible — any
   * staff with lms:view saw every lecture tenant-wide.
   */
  @Get()
  @Permissions({ module: 'lms', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('schoolClassId') schoolClassId: string | undefined,
    @Query('subjectId') subjectId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lecturesService.findAllForTenant(tenantId, { schoolClassId, subjectId }, user.userId);
  }

  /** Self-service — no @Permissions() decorator, same pattern throughout LMS. */
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.lecturesService.findForStudent(user);
  }

  @Get('progress/mine')
  getMyProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.lecturesService.getMyProgress(user);
  }

  /** Self-service — student marking their own progress; untouched this session, same as Assignments' /mine pattern. */
  @Post(':id/watched')
  markWatched(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lecturesService.markWatched(id, user);
  }

  /**
   * res.sendFile() delegates to Express's `send` package, which handles
   * HTTP Range requests (206 partial content, Content-Range, Accept-Ranges)
   * automatically — confirmed live via curl (session 27) with a real Range
   * header returning 206 + the correct byte slice. No custom streaming code
   * needed; a prior comment here incorrectly assumed this was unimplemented.
   *
   * Dual staff-OR-own-class authorization via assertClassAccess, PLUS a
   * teacher-class-AND-subject layer on the staff branch this session (see
   * getFileForDownload's doc comment in the service).
   */

  @Get(':id/media-token')
  getMediaToken(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lecturesService.getMediaToken(id, user);
  }

  @Get(':id/file')
  @Public()
  async streamFile(@Param('id') id: string, @Query('token') token: string, @Res() res: Response) {
    const { filePath, filename, mimeType } = await this.lecturesService.getFileForMediaToken(id, token);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.sendFile(filePath);
  }
  /** Mints a short-lived, single-lecture media token — see LecturesService.getMediaToken. */
  
  /**
   * Teacher-class-AND-subject-scoped this session: previously had no
   * ownership check at all beyond the lms:delete permission gate.
   */
  @Delete(':id')
  @Permissions({ module: 'lms', action: 'delete' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lecturesService.remove(id, user);
  }
}