import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FeePaymentsService } from './fee-payments.service';
import { CreateFeePaymentDto } from './dto/create-fee-payment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('fee-payments')
@ApiBearerAuth()
@Controller('fee-payments')
export class FeePaymentsController {
  constructor(private readonly feePaymentsService: FeePaymentsService) {}

  @Post()
  @Permissions({ module: 'fee-management', action: 'create' })
  create(@Body() dto: CreateFeePaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.feePaymentsService.create(user.tenantId, dto, user.userId);
  }

  @Get('by-assignment/:assignmentId')
  @Permissions({ module: 'fee-management', action: 'view' })
  findForAssignment(@Param('assignmentId') assignmentId: string) {
    return this.feePaymentsService.findForAssignment(assignmentId);
  }

  @Get(':id/receipt')
  @Permissions({ module: 'fee-management', action: 'view' })
  async getReceipt(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.feePaymentsService.generateReceiptPdf(id);
    // Explicitly send raw bytes ourselves rather than `return`-ing the
    // buffer — returning it and relying on Nest's automatic response
    // handling risks the Buffer getting JSON-serialized (a file that LOOKS
    // like a PDF — right content-type, right filename — but whose actual
    // bytes are a text description of the buffer, not real PDF binary).
    // That produced exactly this bug: no error anywhere, download
    // "succeeds," and the file won't open. res.send() with a real Buffer
    // guarantees raw bytes go out over the wire.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${id}.pdf"`);
    res.send(pdf);
  }

  /**
   * Self-service, Parent only (Teacher access was built, tested, and then
   * explicitly reversed by direct request). No @Permissions() decorator;
   * the gate is assertParentFeeAccess inside the service, re-derived from
   * the payment's own assignment/student, not trusted from the caller.
   */
  @Get('my-access/by-assignment/:assignmentId')
  findForAssignmentSelfService(@Param('assignmentId') assignmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.feePaymentsService.findForAssignmentSelfService(user, assignmentId);
  }

  @Get('my-access/receipt/:paymentId')
  async getReceiptSelfService(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const pdf = await this.feePaymentsService.generateReceiptPdfSelfService(user, paymentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${paymentId}.pdf"`);
    res.send(pdf);
  }
}
