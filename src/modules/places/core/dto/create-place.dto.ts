import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePlaceDto {
  @ApiProperty({ example: 'Place Name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Place description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: -6.9218, description: 'Latitude in decimal degrees' })
  @IsNotEmpty({ message: 'Latitude is required' })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude: number;

  @ApiProperty({ example: 107.607, description: 'Longitude in decimal degrees' })
  @IsNotEmpty({ message: 'Longitude is required' })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude: number;

  @ApiProperty({ example: 1, description: 'District ID' })
  @IsNotEmpty({ message: 'District ID is required' })
  @IsInt({ message: 'District ID must be an integer' })
  districtId: number;

  @ApiProperty({ example: 1, description: 'User ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsInt({ message: 'User ID must be an integer' })
  userId: number;

  @ApiProperty({ example: 2, description: 'Layer ID for the point feature' })
  @IsNotEmpty({ message: 'Layer ID is required' })
  @IsInt({ message: 'Layer ID must be an integer' })
  layerId: number;

  @ApiProperty({ example: true, default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
