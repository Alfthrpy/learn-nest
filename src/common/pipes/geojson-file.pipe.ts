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
export class GeoJsonFilePipe implements PipeTransform<Express.Multer.File, string> {
  transform(file?: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestException('GeoJSON file is required');
    }

    const extension = extname(file.originalname).toLowerCase();
    if (extension !== '.geojson' && extension !== '.json') {
      throw new BadRequestException('Only .geojson or .json files are accepted');
    }

    let geoJson: { type?: string };
    try {
      geoJson = JSON.parse(file.buffer.toString('utf8'));
    } catch {
      throw new BadRequestException('The uploaded file is not valid JSON');
    }

    if (!geoJson || !geometryTypes.has(geoJson.type ?? '')) {
      throw new BadRequestException('The uploaded file must contain a valid GeoJSON geometry');
    }

    return file.buffer.toString('utf8');
  }
}
