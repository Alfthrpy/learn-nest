import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {District as PrismaDistrict, Place} from '@prisma/client';



export class DistrictEntity implements Partial<PrismaDistrict> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    geom: any;

    @ApiProperty()
    description: string;

    @ApiProperty()
    created_at: Date;

    @ApiPropertyOptional()
    updated_at: Date;

    @ApiProperty()
    deleted_at: Date | null;

    @ApiPropertyOptional()
    places?: Partial<Place[]>;

    constructor(partial: Partial<DistrictEntity>) {
        Object.assign(this, partial);
    }
}
