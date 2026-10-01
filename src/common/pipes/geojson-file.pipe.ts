import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { extname } from 'node:path';

const geometryTypes = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
]);

@Injectable()
export class GeoJsonFilePipe
  implements PipeTransform<Express.Multer.File | undefined, Record<string, unknown> | undefined>
{
  transform(file?: Express.Multer.File): Record<string, unknown> | undefined {
    if (!file) {
      return undefined;
    }

    const extension = extname(file.originalname).toLowerCase();
    if (extension !== '.geojson' && extension !== '.json') {
      throw new BadRequestException('Only .geojson or .json files are accepted');
    }

    let geoJson: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(file.buffer.toString('utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('GeoJSON must be an object');
      }
      geoJson = parsed as Record<string, unknown>;
    } catch {
      throw new BadRequestException('The uploaded file is not valid JSON');
    }

    if (!geometryTypes.has(typeof geoJson.type === 'string' ? geoJson.type : '')) {
      throw new BadRequestException('The uploaded file must contain a valid GeoJSON geometry');
    }

    return geoJson;
  }
}
