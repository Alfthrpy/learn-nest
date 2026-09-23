import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ConflictException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateDistrictDto } from './core/dto/create-district.dto';
import { UpdateDistrictDto } from './core/dto/update-district.dto';
import { DistrictEntity } from './core/entities/district.entity';
import { DistrictTransformHelper } from './core/helper/district-transform.helper';

@Injectable()
export class DistrictService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDistrictDto: CreateDistrictDto): Promise<any> {
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
    const districts = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        d."id",
        d."name",
        d."description",
        d."created_at",
        d."updated_at",
        d."deleted_at",
        ST_AsGeoJSON(d."geom")::json AS "geom",
        COALESCE(
          json_agg(
            json_build_object(
              'id', p."id",
              'name', p."name",
              'description', p."description",
              'is_active', p."is_active",
              'created_at', p."created_at",
              'updated_at', p."updated_at",
              'deleted_at', p."deleted_at",
              'user_id', p."user_id",
              'district_id', p."district_id",
              'point', ST_AsGeoJSON(p."point")::json
            )
          ) FILTER (WHERE p."id" IS NOT NULL),
          '[]'::json
        ) AS "places"
      FROM "districts" d
      LEFT JOIN "places" p ON p."district_id" = d."id"
      GROUP BY d."id", d."name", d."description", d."created_at", d."updated_at", d."deleted_at", d."geom"
    `);

    return {
      type: 'Districts',
      count: districts.length,
      data: DistrictTransformHelper.toEntities(districts),
    };
  }

  async findOne(id: number): Promise<DistrictEntity> {
    const [district] = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        d."id",
        d."name",
        d."description",
        d."created_at",
        d."updated_at",
        d."deleted_at",
        ST_AsGeoJSON(d."geom")::json AS "geom",
        COALESCE(
          json_agg(
            json_build_object(
              'id', p."id",
              'name', p."name",
              'description', p."description",
              'is_active', p."is_active",
              'created_at', p."created_at",
              'updated_at', p."updated_at",
              'deleted_at', p."deleted_at",
              'user_id', p."user_id",
              'district_id', p."district_id",
              'point', ST_AsGeoJSON(p."point")::json
            )
          ) FILTER (WHERE p."id" IS NOT NULL),
          '[]'::json
        ) AS "places"
      FROM "districts" d
      LEFT JOIN "places" p ON p."district_id" = d."id"
      WHERE d."id" = ${id}
      GROUP BY d."id", d."name", d."description", d."created_at", d."updated_at", d."deleted_at", d."geom"
    `);

    if (!district) {
      throw new NotFoundException('District not found');
    }

    return DistrictTransformHelper.toEntity(district);
  }

  async update(id: number, updateDistrictDto: UpdateDistrictDto): Promise<DistrictEntity> {
    const { name, description, geom } = updateDistrictDto;

    const district = await this.prisma.district.findUnique({
        where: { id },
    })

    if (!district) {
        throw new NotFoundException('District not found');
    }

    let geoJsonValue: string;

    if (typeof geom === 'string') {
      geoJsonValue = geom.trim();
    }
    else if (geom && typeof geom === 'object') {
      geoJsonValue = JSON.stringify(geom);
    }

const [updatedDistrict] =
  await this.prisma.$queryRaw<DistrictEntity[]>(
    Prisma.sql`
      UPDATE "districts"
      SET
        "name" = ${name ?? district.name},
        "description" = ${description ?? district.description}
        ${
          geoJsonValue
            ? Prisma.sql`,
        "geom" = ST_SetSRID(
          ST_GeomFromGeoJSON(${geoJsonValue}),
          4326
        )`
            : Prisma.empty
        }
      WHERE "id" = ${id}
      RETURNING *
    `,
  );

    return DistrictTransformHelper.toEntity(updatedDistrict);
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