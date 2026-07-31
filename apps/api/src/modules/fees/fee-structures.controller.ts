import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('fee-structures')
@ApiBearerAuth()
@Controller('fee-structures')
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Post()
  @Permissions({ module: 'fee-management', action: 'create' })
  create(@Body() dto: CreateFeeStructureDto) {
    return this.feeStructuresService.create(dto);
  }

  @Get()
  @Permissions({ module: 'fee-management', action: 'view' })
  findAllForTenant(@Query('tenantId') tenantId: string, @Query('gradeLevel') gradeLevel?: string) {
    return this.feeStructuresService.findAllForTenant(tenantId, gradeLevel);
  }

  @Get(':id')
  @Permissions({ module: 'fee-management', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.feeStructuresService.findOne(id);
  }
}
