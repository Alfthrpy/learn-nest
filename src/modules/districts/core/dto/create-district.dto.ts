import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDistrictDto {
  @ApiProperty({ example: 'District Name' })
  @IsNotEmpty({ message: 'District name is required' })
  name: string;

  @ApiProperty({ example: 'District description', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Available Layer ID' })
  @IsNotEmpty({ message: 'Layer ID is required' })
  @Type(() => Number)
  @IsInt({ message: 'Layer ID must be an integer' })
  layerId: number;
}
