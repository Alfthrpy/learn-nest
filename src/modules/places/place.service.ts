import { Prisma } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreatePlaceDto } from './core/dto/create-place.dto';
import { UpdatePlaceDto } from './core/dto/update-place.dto';
import { PlaceEntity } from './core/entities/place.entity';
import { PlaceQueryDto } from './core/dto/place-query.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';

@Injectable()
export class PlaceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly selectSql = Prisma.sql`
      SELECT
        p."id",
        p."name",
        p."description",
        p."is_active",
        p."feature_id",
        p."district_id",
        p."user_id",
        p."created_at",
        p."updated_at",
        p."deleted_at",
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
      FROM "places" p
      LEFT JOIN "features" f ON p."feature_id" = f."id"
  `;

  private readonly groupBySql = Prisma.sql`
      GROUP BY
        p."id",
        p."name",
        p."description",
        p."is_active",
        p."feature_id",
        p."district_id",
        p."user_id",
        p."created_at",
        p."updated_at",
        p."deleted_at"
  `;

  async create(createPlaceDto: CreatePlaceDto): Promise<PlaceEntity> {
    const { name, description, latitude, longitude, districtId, userId, layerId, isActive } =
      createPlaceDto;

    const layer = await this.prisma.layer.findUnique({ where: { id: layerId } });
    if (!layer) {
      throw new BadRequestException('Layer not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const district = await this.prisma.district.findUnique({ where: { id: districtId } });
    if (!district) {
      throw new BadRequestException('District not found');
    }

    const [feature] = await this.prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO "features" ("geom", "name", "layer_id", "created_at", "updated_at")
        VALUES (
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${name},
          ${layerId},
          NOW(),
          NOW()
        )
        RETURNING "id"
      `,
    );

    const place = await this.prisma.place.create({
      data: {
        name,
        description: description ?? null,
        is_active: isActive ?? true,
        district_id: districtId,
        user_id: userId,
        feature_id: feature.id,
      },
    });

    return this.findOne(place.id);
  }

  async findAll(query: PlaceQueryDto): Promise<PaginatedResponseDto<PlaceEntity>> {
    const { page = 1, limit = 10, search, districtName } = query;
    const skip = (page - 1) * limit;
    const searchTerm = search?.trim();
    const districtNameTerm = districtName?.trim();

    const searchFilter = searchTerm
      ? Prisma.sql`AND p."name" ILIKE ${`%${searchTerm}%`}`
      : Prisma.sql``;
    const districtFilter = districtNameTerm
      ? Prisma.sql`
          AND EXISTS (
            SELECT 1
            FROM "districts" d
            WHERE d."id" = p."district_id"
              AND d."deleted_at" IS NULL
              AND d."name" ILIKE ${`%${districtNameTerm}%`}
          )
        `
      : Prisma.sql``;
    const whereClause = Prisma.sql`
      WHERE p."deleted_at" IS NULL
      ${searchFilter}
      ${districtFilter}
    `;

    const [places, countResult] = await Promise.all([
      this.prisma.$queryRaw<PlaceEntity[]>(Prisma.sql`
        ${this.selectSql}
        ${whereClause}
        ${this.groupBySql}
        ORDER BY p."created_at" DESC, p."id" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `),
      this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS "total"
        FROM "places" p
        ${whereClause}
      `),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      data: places,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<PlaceEntity> {
    const [place] = await this.prisma.$queryRaw<PlaceEntity[]>(
      Prisma.sql`
        ${this.selectSql}
        WHERE p."id" = ${id} AND p."deleted_at" IS NULL
        ${this.groupBySql}
      `,
    );

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    return place;
  }

  async update(id: number, updatePlaceDto: UpdatePlaceDto): Promise<PlaceEntity> {
    const { name, description, latitude, longitude, districtId, userId, isActive } = updatePlaceDto;

    const place = await this.prisma.place.findUnique({ where: { id } });

    if (!place || place.deleted_at) {
      throw new NotFoundException('Place not found');
    }

    const placeData: Prisma.PlaceUpdateInput = {};

    if (name !== undefined) placeData.name = name;
    if (description !== undefined) placeData.description = description;
    if (isActive !== undefined) placeData.is_active = isActive;
    if (districtId !== undefined) placeData.district = { connect: { id: districtId } };
    if (userId !== undefined) placeData.user = { connect: { id: userId } };

    if (Object.keys(placeData).length > 0) {
      await this.prisma.place.update({
        where: { id },
        data: placeData,
      });
    }

    if (latitude !== undefined && longitude !== undefined) {
      await this.prisma.$queryRaw(
        Prisma.sql`
          UPDATE "features"
          SET
            "geom" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
            "updated_at" = NOW()
          WHERE "id" = ${place.feature_id}
        `,
      );
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<PlaceEntity> {
    const place = await this.prisma.place.findUnique({ where: { id } });

    if (!place || place.deleted_at) {
      throw new NotFoundException('Place not found');
    }

    const [deletedPlace] = await this.prisma.$queryRaw<PlaceEntity[]>(
      Prisma.sql`
        UPDATE "places"
        SET "deleted_at" = NOW(), "updated_at" = NOW()
        WHERE "id" = ${id}
        RETURNING *
      `,
    );

    await this.prisma.$queryRaw(
      Prisma.sql`
        UPDATE "features"
        SET "deleted_at" = NOW(), "updated_at" = NOW()
        WHERE "id" = ${place.feature_id} AND "deleted_at" IS NULL
      `,
    );

    return deletedPlace;
  }
}
