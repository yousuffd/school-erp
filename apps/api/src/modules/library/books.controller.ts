import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateBookCopyDto } from './dto/create-book-copy.dto';
import { UpdateBookCopyStatusDto } from './dto/update-book-copy-status.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('library-books')
@ApiBearerAuth()
@Controller('library/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Permissions({ module: 'library', action: 'create' })
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Get()
  @Permissions({ module: 'library', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @Query('title') title?: string,
    @Query('author') author?: string,
    @Query('category') category?: string,
  ) {
    return this.booksService.findAllForTenant(tenantId, { title, author, category });
  }

  // Static-prefixed route declared above ':id' so Nest doesn't swallow it
  // as an :id param — same convention as ExamsController's 'my-results'.
  // (Not actually ambiguous here since segment counts differ, but kept
  // consistent with the project's established ordering discipline.)
  @Patch('copies/:copyId/status')
  @Permissions({ module: 'library', action: 'edit' })
  updateCopyStatus(@Param('copyId') copyId: string, @Body() dto: UpdateBookCopyStatusDto) {
    return this.booksService.updateCopyStatus(copyId, dto);
  }

  @Get(':id')
  @Permissions({ module: 'library', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @Permissions({ module: 'library', action: 'edit' })
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'library', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }

  @Post(':id/copies')
  @Permissions({ module: 'library', action: 'create' })
  addCopy(@Param('id') bookId: string, @Body() dto: CreateBookCopyDto) {
    return this.booksService.addCopy({ ...dto, book_id: bookId });
  }

  @Get(':id/copies')
  @Permissions({ module: 'library', action: 'view' })
  findCopies(@Param('id') bookId: string) {
    return this.booksService.findCopiesForBook(bookId);
  }
}
