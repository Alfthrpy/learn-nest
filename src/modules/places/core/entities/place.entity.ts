import { Feature, Place as PrismaPlace } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceEntity implements Partial<PrismaPlace> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  feature_id: number;

  @ApiProperty()
  district_id: number;

  @ApiProperty()
  user_id: number;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional()
  updated_at: Date;

  @ApiProperty()
  deleted_at: Date | null;

  @ApiPropertyOptional()
  features?: Feature[];

  constructor(partial: Partial<PlaceEntity>) {
    Object.assign(this, partial);
  }
}
