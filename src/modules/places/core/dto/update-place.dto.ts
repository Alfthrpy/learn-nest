import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePlaceDto } from './create-place.dto';
import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePlaceDto extends PartialType(CreatePlaceDto) {
        @ApiPropertyOptional({example: 'latitude'})
        @IsNotEmpty({message: 'Latitude is required'})
        latitude: string;
    
        @ApiPropertyOptional({example: 'longitude'})
        @IsNotEmpty({message: 'Longitude is required'})
        longitude: string;
    
        @ApiPropertyOptional({ example: 'Place Name' })
        @IsNotEmpty({ message: 'Name is required' })
        name: string;
    
        @ApiPropertyOptional({ example: 'Place Description' })
        @IsOptional()
        description: string;
    
        @ApiPropertyOptional({example:true,default:true})
        @IsBoolean()
        isActive: boolean;
    
        @ApiPropertyOptional({example:"District ID"})
        @IsNotEmpty({message: 'District ID is required'})
        districtId: number;
    
        @ApiPropertyOptional({example:"User ID"})
        @IsNotEmpty({message: 'User ID is required'})
        userId: number;
}
