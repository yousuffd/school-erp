import { IsOptional, IsString, MaxLength } from 'class-validator';

// Fields written by hand rather than PartialType(CreateBookDto) — avoids
// assuming @nestjs/mapped-types is installed without having verified it
// (not seen in any file reviewed this session). Trivial to switch later
// if the package turns out to already be a project dependency.
export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  publisher?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  edition?: string;

  @IsOptional()
  @IsString()
  cover_url?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
