import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class CreateDistrictDto {

    @ApiProperty({ example: 'SRID=4326;POLYGON((...))', description: 'Geometry in GeoJSON format' })
    @IsNotEmpty({ message: 'GeoJSON is required' })
    geom: any;

}