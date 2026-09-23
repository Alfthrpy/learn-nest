import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ConflictException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateDistrictDto } from './core/dto/create-district.dto';
import { DistrictEntity } from './core/entities/district.entity';
import { DistrictTransformHelper } from './core/helper/district-transform.helper';

@Injectable()
export class DistrictService {
  constructor(private readonly prisma: PrismaService) {}

  async createDistrict(createDistrictDto: CreateDistrictDto): Promise<any> {
    const { name, description, geom } = createDistrictDto;

    const existingDistrict = await this.prisma.district.findUnique({
      where: { name },
    });

    if (existingDistrict) {
      throw new ConflictException('District with this name already exists');
    }

    let geoJsonValue: string;

    if (typeof geom === 'string') {
      geoJsonValue = geom.trim();
    } else if (geom && typeof geom === 'object') {
      geoJsonValue = JSON.stringify(geom);
    } else {
      throw new BadRequestException('Geometry must be a valid GeoJSON object or WKT string');
    }

    const [district] = await this.prisma.$queryRaw<DistrictEntity[]>(Prisma.sql`
      INSERT INTO "districts" ("name", "description", "geom")
      VALUES (${name}, ${description ?? null}, ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonValue}), 4326))
      RETURNING *
    `);

    return district.id;
  }

  async findAll(): Promise<any> {
    const districts = await this.prisma.district.findMany({
        include: {
            places: true,
        }
    });

    return {
        type : 'Districts',
        count : districts.length,
        data : DistrictTransformHelper.toEntities(districts),
    }
    
  }

  async findOne(id: number): Promise<DistrictEntity> {
    const district = await this.prisma.district.findUnique({
        where: { id },
        include: {
            places: true,
        }
    })

    if (!district) {
        throw new NotFoundException('District not found');
    }

    return DistrictTransformHelper.toEntity(district);
  }

  async remove(id: number): Promise<void> {
    const district = await this.prisma.district.findUnique({
        where: { id },
    })

    if (!district) {
        throw new NotFoundException('District not found');
    }

    await this.prisma.district.delete({
        where: { id },
    })
  }
}