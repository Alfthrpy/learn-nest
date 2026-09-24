import {Layer as PrismaLayer, Feature, Prisma} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LayerEntity implements Partial<PrismaLayer> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    data_type: string;

    @ApiPropertyOptional()
    description: string;

    @ApiPropertyOptional()
    properties: Prisma.JsonValue;

    @ApiPropertyOptional()
    features?: Feature[];

    @ApiProperty()
    created_at: Date;

    @ApiPropertyOptional()
    updated_at: Date;

    @ApiProperty()
    deleted_at: Date | null;

    constructor(partial: Partial<LayerEntity>) {
        Object.assign(this, partial);
    }
}
