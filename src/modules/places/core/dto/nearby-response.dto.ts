import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class NearbyPlaceResponseDto {
  @ApiProperty()
  id:number;
  
  @ApiProperty()
  name:string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  distance_m : number;

  constructor(partial: Partial<NearbyPlaceResponseDto>) {
    Object.assign(this, partial);
  }
}
