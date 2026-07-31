import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookIssuesService } from './book-issues.service';
import { IssueBookDto } from './dto/issue-book.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('library-issues')
@ApiBearerAuth()
@Controller('library/issues')
export class BookIssuesController {
  constructor(private readonly issuesService: BookIssuesService) {}

  @Post()
  @Permissions({ module: 'library', action: 'create' })
  issue(@Body() dto: IssueBookDto, @CurrentUser() user: AuthenticatedUser) {
    return this.issuesService.issue(dto, user.userId);
  }

  @Post('return')
  @Permissions({ module: 'library', action: 'edit' })
  returnBook(@Body() dto: ReturnBookDto, @CurrentUser() user: AuthenticatedUser) {
    return this.issuesService.returnBook(dto, user.userId);
  }

  @Get()
  @Permissions({ module: 'library', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('studentId') studentId?: string,
    @Query('overdueOnly') overdueOnly?: string,
  ) {
    return this.issuesService.findAllForTenant(tenantId, { studentId, overdueOnly: overdueOnly === 'true' });
  }

  @Get(':id')
  @Permissions({ module: 'library', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }
}
