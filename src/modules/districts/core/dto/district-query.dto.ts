import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString} from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

export class DistrictQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'District' })
  @IsOptional()
  @IsString()
  search?: string;
}
