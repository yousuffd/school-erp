import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportCardsService } from './report-cards.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { assertOwnStudentAccess } from '../../common/utils/student-ownership.util';

@ApiTags('report-cards')
@ApiBearerAuth()
@Controller('report-cards')
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  // No @Permissions() decorator here on purpose — this route is shared by
  // staff (any studentId, gated by the examinations:view permission) and by
  // a Student viewing their own report card (gated by studentId match
  // instead). The real gate is the explicit assertOwnStudentAccess check
  // below, not the decorator.

  @Get('by-student/:studentId')
  getData(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('examName') examName: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertOwnStudentAccess(user, studentId, 'examinations', 'view');
    return this.reportCardsService.generateReportCardData(studentId, academicYearId, user.tenantId, user.userId, examName);
  }

  @Get('by-student/:studentId/pdf')
  async getPdf(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('examName') examName: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    assertOwnStudentAccess(user, studentId, 'examinations', 'view');
    const pdf = await this.reportCardsService.generateReportCardPdf(studentId, academicYearId, user.tenantId, user.userId, examName);
    // Send raw bytes directly via res.send() rather than returning the
    // buffer — returning it and relying on Nest's automatic response
    // handling risks the Buffer getting JSON-serialized instead of sent as
    // real binary (the exact bug hit and fixed once already on fee receipts).
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-card-${studentId}.pdf"`);
    res.send(pdf);
  }
}
