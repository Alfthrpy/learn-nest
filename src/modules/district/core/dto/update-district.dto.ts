import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
  

export class UpdateDistrictDto {
  @ApiPropertyOptional({ example: 'District Name' })
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ example: 'District description', required: false })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [107.5, -6.8],
          [107.7, -6.8],
          [107.7, -6.9],
          [107.5, -6.9],
          [107.5, -6.8],
        ],
      ],
    },
    description: 'Geometry in GeoJSON format',
  })
  @IsOptional()
  geom: Record<string, any> | string;
}