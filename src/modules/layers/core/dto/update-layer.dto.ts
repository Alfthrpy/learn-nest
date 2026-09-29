import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";


export class UpdateLayerDto {
    @ApiProperty({ example: 'Layer Name' })
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'Layer Data Type' })
    @IsOptional()
    dataType?: string;

    @ApiProperty({ example: 'Layer Description' })
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: { key: 'value' } })
    @IsOptional()
    properties?: Record<string, any>;

}


