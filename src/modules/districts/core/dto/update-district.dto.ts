import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateDistrictDto {
  @ApiPropertyOptional({ example: 'District Name' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'District description', required: false })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Available Layer ID' })
  @IsOptional()
  layerId?: number;
}
