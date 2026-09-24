import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDistrictDto {
  @ApiProperty({ example: 'District Name' })
  @IsNotEmpty({ message: 'District name is required' })
  name: string;

  @ApiProperty({ example: 'District description', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Available Layer ID' })
  @IsNotEmpty({ message: 'Layer ID is required' })
  layerId: number;
}
