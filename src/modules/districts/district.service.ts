import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDistrictDto } from './core/dto/create-district.dto';
import { UpdateDistrictDto } from './core/dto/update-district.dto';
import { DistrictEntity } from './core/entities/district.entity';
import { DistrictTransformHelper } from './core/helper/district-transform.helper';

@Injectable()
export class DistrictService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDistrictDto: CreateDistrictDto, featureId: number): Promise<any> {
    const { name, description } = createDistrictDto;

    const existingDistrict = await this.prisma.district.findFirst({
      where: { name, deleted_at: null },
    });

    if (existingDistrict) {
      throw new ConflictException('District with the same name already exists');
    }

    const district = await this.prisma.district.create({
      data: {
        name,
        description,
        feature_id: featureId,
      },
    });

    return district.id;
  }

  async createFromGeoJson(geoJsonValue: string, layerId: number, name: string): Promise<any> {
    if (!layerId) {
      throw new BadRequestException('Layer ID is required');
    }

    const layer = await this.prisma.layer.findUnique({ where: { id: layerId } });
    if (!layer) {
      throw new BadRequestException('Layer not found');
    }

    const feature = await this.prisma.$queryRaw<any[]>(Prisma.sql`
        INSERT INTO "features" ("layer_id", "geom", "name", "updated_at")
        VALUES (${layerId}, ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonValue}), 4326), ${name}, NOW())
        RETURNING *
      `);

    return feature;
  }

  async findAll(): Promise<any> {
    const districts = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        d."id",
        d."name",
        d."description",
        d."feature_id",
        d."created_at",
        d."updated_at",
        d."deleted_at",
        COALESCE(
          json_agg(
            json_build_object(
              'id', f."id",
              'geom', ST_AsGeoJSON(f."geom")::json,
              'name', f."name",
              'properties', f."properties",
              'layer_id', f."layer_id"
            )
          ) FILTER (WHERE f."id" IS NOT NULL),
          '[]'::json
        ) AS "features"
      FROM "districts" d
      LEFT JOIN "features" f ON d."feature_id" = f."id"
      WHERE d."deleted_at" IS NULL
      GROUP BY
        d."id",
        d."name",
        d."description",
        d."feature_id",
        d."created_at",
        d."updated_at",
        d."deleted_at"
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
        d."feature_id",
        d."created_at",
        d."updated_at",
        d."deleted_at",
        COALESCE(
          json_agg(
            json_build_object(
              'id', f."id",
              'geom', ST_AsGeoJSON(f."geom")::json,
              'name', f."name",
              'properties', f."properties",
              'layer_id', f."layer_id"
            )
          ) FILTER (WHERE f."id" IS NOT NULL),
          '[]'::json
        ) AS "features"
      FROM "districts" d
      LEFT JOIN "features" f ON d."feature_id" = f."id"
      WHERE d."id" = ${id} AND d."deleted_at" IS NULL
      GROUP BY
        d."id",
        d."name",
        d."description",
        d."feature_id",
        d."created_at",
        d."updated_at",
        d."deleted_at"
    `);

    if (!district) {
      throw new NotFoundException('District not found');
    }

    return DistrictTransformHelper.toEntity(district);
  }

  async update(
    id: number,
    updateDistrictDto: UpdateDistrictDto,
    geoJsonValue?: string,
  ): Promise<DistrictEntity> {
    const { name, description } = updateDistrictDto;

    const district = await this.prisma.district.findUnique({
      where: { id },
      include: { feature: true },
    });

    if (!district || district.deleted_at) {
      throw new NotFoundException('District not found');
    }

    const districtData: Prisma.DistrictUpdateInput = {};

    if (name !== undefined) {
      districtData.name = name;
    }

    if (description !== undefined) {
      districtData.description = description;
    }

    if (Object.keys(districtData).length > 0) {
      await this.prisma.district.update({
        where: { id },
        data: districtData,
      });
    }

    if (geoJsonValue) {
      await this.prisma.$queryRaw<any[]>(Prisma.sql`
        UPDATE "features"
        SET
          "geom" = ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonValue}), 4326),
          "updated_at" = NOW()
        WHERE "id" = ${district.feature_id}
        RETURNING *
      `);
    }

    const refreshedDistrict = await this.prisma.district.findUnique({
      where: { id },
      include: { feature: true },
    });

    return DistrictTransformHelper.toEntity({
      ...refreshedDistrict,
      features: refreshedDistrict?.feature ? [refreshedDistrict.feature] : [],
    });
  }

  async remove(id: number): Promise<void> {
    const district = await this.prisma.district.findUnique({
      where: { id },
    });

    if (!district || district.deleted_at) {
      throw new NotFoundException('District not found');
    }

    await this.prisma.district.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.prisma.$queryRaw(
      Prisma.sql`
        UPDATE "features"
        SET "deleted_at" = NOW(), "updated_at" = NOW()
        WHERE "id" = ${district.feature_id} AND "deleted_at" IS NULL
      `,
    );
  }
}
