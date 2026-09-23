import { District, Place } from '@prisma/client';
import { DistrictEntity } from '../entities/district.entity';

type DistrictWithRelations = District & {
  places?: Place[];
};

export class DistrictTransformHelper {
  static toEntity(district: DistrictWithRelations): DistrictEntity {
    return new DistrictEntity({
      ...district,
      places: district.places
        ? district.places.map((place) => ({
            ...place,
            point: place.point,
          }))
        : [],
    });
  }

  static toEntities(districts: DistrictWithRelations[]): DistrictEntity[] {
    return districts.map((district) => this.toEntity(district));
  }
}