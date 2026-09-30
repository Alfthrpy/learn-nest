import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@common/dto/pagination.dto';

export class NearbyQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: -6.953382, type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 107.696672, type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 100, type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  radius?: number;
}
