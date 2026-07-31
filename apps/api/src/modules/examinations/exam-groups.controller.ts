import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExamGroupsService } from './exam-groups.service';
import { CreateExamGroupDto, UpdateExamGroupDto } from './dto/exam-group.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

// Reuses the exact same 'examinations' permission keys as ExamsController —
// from the Teacher's point of view, bulk exam creation is the same
// capability as single exam creation, just batched. No separate
// 'exam-groups' permission set, matching phase2-permission-matrix.ts as-is.
@ApiTags('exam-groups')
@ApiBearerAuth()
@Controller('exam-groups')
export class ExamGroupsController {
  constructor(private readonly examGroupsService: ExamGroupsService) {}

  @Get()
  @Permissions({ module: 'examinations', action: 'view' })
  findAll(@Query('tenantId') tenantId: string) {
    return this.examGroupsService.findAll(tenantId);
  }

  @Get(':id')
  @Permissions({ module: 'examinations', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.examGroupsService.findOne(id);
  }

  @Post()
  @Permissions({ module: 'examinations', action: 'create' })
  bulkCreate(@Body() dto: CreateExamGroupDto, @CurrentUser() user: AuthenticatedUser) {
    return this.examGroupsService.bulkCreate(dto, user.userId);
  }

  @Patch(':id')
  @Permissions({ module: 'examinations', action: 'edit' })
  update(@Param('id') id: string, @Body() dto: UpdateExamGroupDto) {
    return this.examGroupsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'examinations', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.examGroupsService.remove(id);
  }
}