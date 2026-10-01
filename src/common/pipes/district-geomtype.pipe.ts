import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

type Position = number[];

@Injectable()
export class DistrictGeomTypePipe
  implements PipeTransform<Record<string, unknown> | undefined, string | undefined>
{
  transform(geoJson?: Record<string, unknown>): string | undefined {
    if (!geoJson) {
      return undefined;
    }

    if (geoJson.type !== 'Polygon' && geoJson.type !== 'MultiPolygon') {
      throw new BadRequestException('District geometry must be a Polygon or MultiPolygon');
    }

    if (geoJson.type === 'Polygon') {
      this.validatePolygon(geoJson.coordinates);
    } else {
      if (!Array.isArray(geoJson.coordinates) || geoJson.coordinates.length === 0) {
        throw new BadRequestException('MultiPolygon must contain at least one polygon');
      }
      geoJson.coordinates.forEach((polygon) => this.validatePolygon(polygon));
    }

    return JSON.stringify(geoJson);
  }

  private validatePolygon(coordinates: unknown): void {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new BadRequestException('Polygon must contain at least one linear ring');
    }

    coordinates.forEach((ring) => this.validateRing(ring));
  }

  private validateRing(ring: unknown): void {
    if (!Array.isArray(ring) || ring.length < 4) {
      throw new BadRequestException('Each polygon ring must contain at least four positions');
    }

    ring.forEach((position) => this.validatePosition(position));

    const first = ring[0] as Position;
    const last = ring[ring.length - 1] as Position;
    if (first.length !== last.length || first.some((coordinate, index) => coordinate !== last[index])) {
      throw new BadRequestException('Each polygon ring must be closed');
    }
  }

  private validatePosition(position: unknown): asserts position is Position {
    if (
      !Array.isArray(position) ||
      position.length < 2 ||
      !position.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate)) ||
      position[0] < -180 ||
      position[0] > 180 ||
      position[1] < -90 ||
      position[1] > 90
    ) {
      throw new BadRequestException('Coordinates must contain valid longitude and latitude values');
    }
  }
}
