import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class CreatePlaceDto {
    @ApiProperty({example: 'latitude'})
    @IsNotEmpty({message: 'Latitude is required'})
    latitude: string;

    @ApiProperty({example: 'longitude'})
    @IsNotEmpty({message: 'Longitude is required'})
    longitude: string;

    @ApiProperty({ example: 'Place Name' })
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @ApiProperty({ example: 'Place Description' })
    @IsOptional()
    description: string;

    @ApiProperty({example:true,default:true})
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({example:"District ID"})
    @IsNotEmpty({message: 'District ID is required'})
    districtId: number;

    @ApiProperty({example:"User ID"})
    @IsNotEmpty({message: 'User ID is required'})
    userId: number;
}
