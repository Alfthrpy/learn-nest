import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class CreateLayerDto {
    @ApiProperty({ example: 'Layer Name' })
    @IsNotEmpty({ message : "Layer Name is required" })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Layer Data Type' })
    @IsNotEmpty({ message : "Layer Data Type is required" })
    @IsString()
    dataType: string;

    @ApiProperty({ example: 'Layer Description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: { key: 'value' } })
    @IsOptional()
    properties?: Record<string, any>;


}


