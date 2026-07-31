import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookReservationsService } from './book-reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus } from './entities/book-reservation.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('library-reservations')
@ApiBearerAuth()
@Controller('library/reservations')
export class BookReservationsController {
  constructor(private readonly reservationsService: BookReservationsService) {}

  @Post()
  @Permissions({ module: 'library', action: 'create' })
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Get()
  @Permissions({ module: 'library', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('bookId') bookId?: string,
    @Query('status') status?: ReservationStatus,
  ) {
    return this.reservationsService.findAllForTenant(tenantId, bookId, status);
  }

  @Post(':id/cancel')
  @Permissions({ module: 'library', action: 'edit' })
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }
}
