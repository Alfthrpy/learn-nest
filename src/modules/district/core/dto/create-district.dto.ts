import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateDistrictDto {
  @ApiProperty({ example: 'District Name' })
  @IsNotEmpty({ message: 'District name is required' })
  name: string;

  @ApiProperty({ example: 'District description', required: false })
  description?: string;

  @ApiProperty({
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
  @IsNotEmpty({ message: 'Geometry is required' })
  geom: Record<string, any> | string;
}