import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Permissions({ module: 'academic-management', action: 'create' })
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  @Get()
  findAllForTenant(@Query('tenantId') tenantId: string) {
    return this.subjectsService.findAllForTenant(tenantId);
  }

  @Get(':id')
  @Permissions({ module: 'academic-management', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @Permissions({ module: 'academic-management', action: 'edit' })
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'academic-management', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}