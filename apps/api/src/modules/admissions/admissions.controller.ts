import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { ChangeAdmissionStageDto } from './dto/change-admission-stage.dto';
import { EnrollAdmissionDto } from './dto/enroll-admission.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('admissions')
@ApiBearerAuth()
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post()
  @Permissions({ module: 'admissions', action: 'create' })
  create(@Body() dto: CreateAdmissionDto) {
    return this.admissionsService.create(dto);
  }

  @Get()
  @Permissions({ module: 'admissions', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('campusId') campusId?: string,
    @Query('stage') stage?: string,
    @Query('search') search?: string,
  ) {
    return this.admissionsService.findAllForTenant(tenantId, { campusId, stage, search });
  }

  @Get(':id')
  @Permissions({ module: 'admissions', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.admissionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions({ module: 'admissions', action: 'edit' })
  update(@Param('id') id: string, @Body() dto: UpdateAdmissionDto) {
    return this.admissionsService.update(id, dto);
  }

  @Patch(':id/stage')
  @Permissions({ module: 'admissions', action: 'edit' })
  changeStage(@Param('id') id: string, @Body() dto: ChangeAdmissionStageDto) {
    return this.admissionsService.changeStage(id, dto);
  }

  @Post(':id/enroll')
  @Permissions({ module: 'admissions', action: 'approve' })
  enroll(@Param('id') id: string, @Body() dto: EnrollAdmissionDto) {
    return this.admissionsService.enroll(id, dto);
  }
}
