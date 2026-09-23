import { District, Place } from '@prisma/client';
import { DistrictEntity } from '../entities/district.entity';

type DistrictWithRelations = District & {
  places?: Place[];
};

export class DistrictTransformHelper {
  private static toGeoJson(value: unknown): Record<string, any> | string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) {
        return null;
      }

      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    if (typeof value === 'object') {
      return value as Record<string, any>;
    }

    return String(value);
  }

  static toEntity(district: any): DistrictEntity {
    const places = Array.isArray(district.places)
      ? district.places.map((place: any) => ({
          ...place,
          point: this.toGeoJson(place?.point),
        }))
      : [];

    return new DistrictEntity({
      ...district,
      geom: this.toGeoJson(district.geom),
      places,
    });
  }

  static toEntities(districts: any[]): DistrictEntity[] {
    return districts.map((district) => this.toEntity(district));
  }
}