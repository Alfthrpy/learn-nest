import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString} from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

export class PlaceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Places' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'District Name'})
  @IsOptional()
  @IsString()
  districtName?: string;
}
