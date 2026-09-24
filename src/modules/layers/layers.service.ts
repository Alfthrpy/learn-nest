import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateLayerDto } from './core/dto/create-layer.dto';
import { UpdateLayerDto } from './core/dto/update-layer.dto';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class LayersService {
  constructor(private readonly prisma:PrismaService) {}

  async create(createLayerDto: CreateLayerDto) {
    const { name, dataType, description, properties } = createLayerDto;
    return this.prisma.layer.create({
      data: {
        name,
        data_type: dataType,
        description,
        properties
      }
    });
  }

  async findAll() {
    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        l."id",
        l."name",
        l."data_type",
        l."description",
        l."properties",
        l."created_at",
        l."updated_at",
        l."deleted_at",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', f."id",
                'geom', ST_AsGeoJSON(f."geom")::json,
                'name', f."name",
                'properties', f."properties",
                'layer_id', f."layer_id",
                'created_at', f."created_at",
                'updated_at', f."updated_at"
              )
              ORDER BY f."id"
            )
            FROM "features" f
            WHERE f."layer_id" = l."id" AND f."deleted_at" IS NULL
          ),
          '[]'::json
        ) AS "features"
      FROM "layers" l
      WHERE l."deleted_at" IS NULL
      ORDER BY l."id"
    `);
  }

  async findOne(id: number) {
    const [layer] = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        l."id",
        l."name",
        l."data_type",
        l."description",
        l."properties",
        l."created_at",
        l."updated_at",
        l."deleted_at",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', f."id",
                'geom', ST_AsGeoJSON(f."geom")::json,
                'name', f."name",
                'properties', f."properties",
                'layer_id', f."layer_id",
                'created_at', f."created_at",
                'updated_at', f."updated_at"
              )
              ORDER BY f."id"
            )
            FROM "features" f
            WHERE f."layer_id" = l."id" AND f."deleted_at" IS NULL
          ),
          '[]'::json
        ) AS "features"
      FROM "layers" l
      WHERE l."id" = ${id} AND l."deleted_at" IS NULL
    `);

    return layer ?? null;
  }

  async update(id: number, updateLayerDto: UpdateLayerDto) {
    const { name, dataType, description, properties } = updateLayerDto;

    const layer = await this.prisma.layer.findUnique({ where: { id } });
    if (!layer || layer.deleted_at) {
      throw new NotFoundException('Layer not found');
    }

    return this.prisma.layer.update({
      where: { id },
      data: {
        name,
        data_type : dataType,
        description,
        properties
      }
    });
  }

  async remove(id: number) {
    const layer = await this.prisma.layer.findUnique({ where: { id } });
    if (!layer || layer.deleted_at) {
      throw new NotFoundException('Layer not found');
    }

    await this.prisma.layer.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.prisma.$queryRaw(
      Prisma.sql`
        UPDATE "features"
        SET "deleted_at" = NOW(), "updated_at" = NOW()
        WHERE "layer_id" = ${id} AND "deleted_at" IS NULL
      `,
    );

    return null;
  }
}
