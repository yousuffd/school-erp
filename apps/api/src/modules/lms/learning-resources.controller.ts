import { Body, Controller, Delete, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { LearningResourcesService } from './learning-resources.service';
import { CreateLearningResourceDto } from './dto/create-learning-resource.dto';
import { resourceUploadOptions } from './config/resource-upload.config';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('learning-resources')
@ApiBearerAuth()
@Controller('learning-resources')
export class LearningResourcesController {
  constructor(private readonly resourcesService: LearningResourcesService) {}

  /**
   * Teacher-class-AND-subject-scoped: a teacher may only upload a resource
   * for a class+subject combination they're actually timetabled to teach
   * (see LearningResourcesService.create). Previously had no ownership
   * check at all beyond the lms:create permission gate.
   */
  @Post()
  @ApiConsumes('multipart/form-data')
  @Permissions({ module: 'lms', action: 'create' })
  @UseInterceptors(FileInterceptor('file', resourceUploadOptions))
  create(
    @Body() dto: CreateLearningResourceDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.create(dto, file, user.userId);
  }

  /**
   * Teacher-class-AND-subject-scoped this session: previously had no
   * @CurrentUser() at all, so no per-teacher filtering was possible — any
   * staff with lms:view saw every resource tenant-wide.
   */
  @Get()
  @Permissions({ module: 'lms', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('schoolClassId') schoolClassId: string | undefined,
    @Query('subjectId') subjectId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.findAllForTenant(tenantId, { schoolClassId, subjectId }, user.userId);
  }

  /** Self-service — no @Permissions() decorator, same pattern as Assignments' /mine. */
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.resourcesService.findForStudent(user);
  }

  /**
   * Dual staff-OR-own-class authorization via assertClassAccess, PLUS a
   * teacher-class-AND-subject layer on the staff branch this session (see
   * getFileForDownload's doc comment in the service for why).
   */
  @Get(':id/file')
  async downloadFile(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { filePath, filename, mimeType } = await this.resourcesService.getFileForDownload(id, user);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.sendFile(filePath);
  }

  /**
   * Teacher-class-AND-subject-scoped this session: previously had no
   * ownership check at all beyond the lms:delete permission gate.
   */
  @Delete(':id')
  @Permissions({ module: 'lms', action: 'delete' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.resourcesService.remove(id, user);
  }
}