import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TranslationHistoryFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ enum: [10, 25, 50], default: 10 })
  @IsInt()
  @IsEnum([10, 25, 50])
  @IsOptional()
  @Type(() => Number)
  page_size?: number = 10;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsString()
  @IsOptional()
  from_date?: string;

  @ApiPropertyOptional({ example: '2026-05-02' })
  @IsString()
  @IsOptional()
  to_date?: string;

  @ApiPropertyOptional({ example: 'vi' })
  @IsString()
  @IsOptional()
  source_lang?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  target_lang?: string;
}
