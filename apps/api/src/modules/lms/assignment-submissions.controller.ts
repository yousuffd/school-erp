import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AssignmentSubmissionsService } from './assignment-submissions.service';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { assignmentUploadOptions } from './config/assignment-upload.config';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('assignment-submissions')
@ApiBearerAuth()
@Controller('assignment-submissions')
export class AssignmentSubmissionsController {
  constructor(private readonly submissionsService: AssignmentSubmissionsService) {}

  /**
   * Self-submit / resubmit. No @Permissions() decorator — see
   * AssignmentSubmissionsService.submit() for why; the ownership check
   * inside the service is the real gate here, not RbacGuard.
   */
  @Post(':assignmentId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', assignmentUploadOptions))
  submit(
    @Param('assignmentId') assignmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.submissionsService.submit(assignmentId, file, user);
  }

  /** Self-service — same no-decorator pattern. */
  @Get('mine')
  findMine(@Query('assignmentId') assignmentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    return this.submissionsService.findMine(user, assignmentId);
  }

  /**
   * Staff roster view. Teacher-class-scoped: a teacher may only pull the
   * roster for an assignment belonging to a class they're timetabled to
   * teach (see AssignmentSubmissionsService.findByAssignment). Falls back
   * to unscoped for Admin/unassigned-teacher callers per the shared util's
   * no-op-if-no-timetable-assignments rule.
   */
  @Get('by-assignment/:assignmentId')
  @Permissions({ module: 'lms', action: 'view' })
  findByAssignment(@Param('assignmentId') assignmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.submissionsService.findByAssignment(assignmentId, user);
  }

  /**
   * Teacher-class-scoped: grading is now gated to the assignment's own
   * class, not just the lms:edit permission tenant-wide (see
   * AssignmentSubmissionsService.grade).
   */
  @Patch(':id/grade')
  @Permissions({ module: 'lms', action: 'edit' })
  grade(@Param('id') id: string, @Body() dto: GradeSubmissionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.submissionsService.grade(id, dto, user);
  }

  /**
   * Streams the raw file — same precedent as PDF receipts/report cards:
   * never return a Buffer for NestJS to JSON-serialize, always res.send/
   * res.sendFile directly. No @Permissions() decorator — dual staff-OR-
   * owner authorization happens inside the service (see
   * getFileForDownload's doc comment for why a decorator alone can't
   * express this, and for the teacher-class-scope check layered onto
   * the staff branch this session).
   */
  @Get(':id/file')
  async downloadFile(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { filePath, filename, mimeType } = await this.submissionsService.getFileForDownload(id, user);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.sendFile(filePath);
  }
}