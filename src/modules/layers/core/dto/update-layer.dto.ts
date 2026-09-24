import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";


export class UpdateLayerDto {
    @ApiProperty({ example: 'Layer Name' })
    @IsNotEmpty({ message : "Layer Name is required" })
    name: string;

    @ApiProperty({ example: 'Layer Data Type' })
    @IsNotEmpty({ message : "Layer Data Type is required" })
    dataType: string;

    @ApiProperty({ example: 'Layer Description' })
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: { key: 'value' } })
    @IsOptional()
    properties?: Record<string, any>;

}


