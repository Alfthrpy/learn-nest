import {Place as PrismaPlace} from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class Place implements Partial<PrismaPlace> {
    @ApiProperty()
    latitude: string;

    @ApiProperty()
    longitude: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    districtId: number;

    @ApiProperty()
    userId: number;

    constructor(partial: Partial<Place>) {
        Object.assign(this, partial);
    }

}
