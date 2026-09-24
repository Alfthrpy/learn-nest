import { Injectable } from '@nestjs/common';
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
            WHERE f."layer_id" = l."id"
          ),
          '[]'::json
        ) AS "features"
      FROM "layers" l
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
            WHERE f."layer_id" = l."id"
          ),
          '[]'::json
        ) AS "features"
      FROM "layers" l
      WHERE l."id" = ${id}
    `);

    return layer ?? null;
  }

  async update(id: number, updateLayerDto: UpdateLayerDto) {
    const { name, dataType, description, properties } = updateLayerDto;
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
    return this.prisma.layer.delete({
      where: { id }
    });
  }
}
