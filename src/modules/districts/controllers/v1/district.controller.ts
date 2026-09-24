import {
    BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DistrictService } from '../../district.service';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/constants/permissions.constant';
import {
  ApiSuccessResponse,
  ApiSuccessArrayResponse,
} from '@common/decorators/api-response.decorator';
import { DistrictEntity } from '@modules/districts/core/entities/district.entity';
import { CreateDistrictDto } from '@modules/districts/core/dto/create-district.dto';
import { UpdateDistrictDto } from '@modules/districts/core/dto/update-district.dto';
import { GeoJsonFilePipe } from '@common/pipes/geojson-file.pipe';

@ApiTags('District')
@Controller({ path: 'district', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DistrictController {
  constructor(private readonly districtService: DistrictService) {}

  @Post()
  @Permissions(PERMISSIONS.DISTRICT.ADD)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'file'],
      properties: {
        name: { type: 'string', example: 'District Name' },
        description: { type: 'string', example: 'District description' },
        layerId: { type: 'integer', example: 1, description: 'Available Layer ID' },
        file: { type: 'string', format: 'binary', description: 'GeoJSON file (.geojson or .json)' },
      },

    },
  })
  @ApiOperation({ summary: 'Create a new district' })
  @ApiSuccessResponse(DistrictEntity)
  async create(
    @Body() createDistrictDto: CreateDistrictDto,
    @UploadedFile(new GeoJsonFilePipe()) geoJsonFile: string,
  ): Promise<number | DistrictEntity> {

    if(geoJsonFile) {
      const feature = await this.districtService.createFromGeoJson(geoJsonFile, createDistrictDto.layerId, createDistrictDto.name);
      return await this.districtService.create(createDistrictDto,feature[0].id);
    } else {
        throw new BadRequestException('GeoJSON file is required to create a district');
    }


  }

  @Get()
  @Permissions(PERMISSIONS.DISTRICT.VIEW)
  @ApiOperation({ summary: 'Get all districts' })
  @ApiSuccessArrayResponse(DistrictEntity)
  async findAll() {
    return this.districtService.findAll();
  }

  @Get(':id')
  @Permissions(PERMISSIONS.DISTRICT.VIEW)
  @ApiOperation({ summary: 'Get district by ID' })
  @ApiSuccessResponse(DistrictEntity)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.districtService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.DISTRICT.UPDATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
    @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated District Name' },
        description: { type: 'string', example: 'Updated district description' },
        file: { type: 'string', format: 'binary', description: 'Optional GeoJSON file (.geojson or .json)' },
      },
    },
  })
  @ApiOperation({ summary: 'Update district' })
  @ApiSuccessResponse(DistrictEntity)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDistrictDto: UpdateDistrictDto,
    @UploadedFile(new GeoJsonFilePipe()) geoJsonFile?: string,
  ) {
    return this.districtService.update(id, updateDistrictDto, geoJsonFile);
  }
  @Delete(':id')
  @Permissions(PERMISSIONS.DISTRICT.DELETE)
  @ApiOperation({ summary: 'Delete district' })
  @ApiSuccessResponse(DistrictEntity)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.districtService.remove(id);
  }
}
