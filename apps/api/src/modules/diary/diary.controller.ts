import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import { CreateDiaryReplyDto } from './dto/create-diary-reply.dto';
import { QueryDiaryEntriesDto } from './dto/query-diary-entries.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequiresFeature } from '../../common/decorators/feature.decorator';

// Feature key uses dot notation to match the hierarchical convention
// confirmed in hostel.controller.ts/cafeteria.controller.ts (e.g.
// 'cafeteria.meal_attendance') — the top-level key is the module name
// itself, per TenantFeatureToggle's design doc comment. No seeding needed:
// absence of a row means enabled=true by default.
@Controller('diary-entries')
@RequiresFeature('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  create(@Body() dto: CreateDiaryEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.diaryService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: QueryDiaryEntriesDto, @CurrentUser() user: AuthenticatedUser) {
    return this.diaryService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.diaryService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDiaryEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.diaryService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.diaryService.remove(id, user);
  }

  @Post(':id/replies')
  addReply(
    @Param('id') id: string,
    @Body() dto: CreateDiaryReplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.diaryService.addReply(id, dto, user);
  }
}