import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassElectiveOfferingsService } from './class-elective-offerings.service';
import { CreateClassElectiveOfferingDto } from './dto/create-class-elective-offering.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('class-elective-offerings')
@ApiBearerAuth()
@Controller('class-elective-offerings')
export class ClassElectiveOfferingsController {
  constructor(private readonly offeringsService: ClassElectiveOfferingsService) {}

  @Post()
  @Permissions({ module: 'academic-management', action: 'create' })
  create(@Body() dto: CreateClassElectiveOfferingDto) {
    return this.offeringsService.create(dto);
  }

  @Get()
  findForClass(@Query('schoolClassId') schoolClassId: string) {
    return this.offeringsService.findForClass(schoolClassId);
  }

  @Delete(':id')
  @Permissions({ module: 'academic-management', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.offeringsService.remove(id);
  }
}