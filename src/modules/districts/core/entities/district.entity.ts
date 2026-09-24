import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {District as PrismaDistrict, Place, Feature} from '@prisma/client';



export class DistrictEntity implements Partial<PrismaDistrict> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    description: string;

    @ApiProperty()
    feature_id: number;

    @ApiProperty()
    created_at: Date;

    @ApiPropertyOptional()
    updated_at: Date;

    @ApiProperty()
    deleted_at: Date | null;

    @ApiPropertyOptional()
    features?: Feature[];

    @ApiPropertyOptional()
    places?: Partial<Place[]>;

    constructor(partial: Partial<DistrictEntity>) {
        Object.assign(this, partial);
    }
}
