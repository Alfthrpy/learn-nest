import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PlaceService } from '../../place.service';
import { CreatePlaceDto } from '../../core/dto/create-place.dto';
import { UpdatePlaceDto } from '../../core/dto/update-place.dto';
import { PlaceEntity } from '../../core/entities/place.entity';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/constants/permissions.constant';
import {
  ApiSuccessResponse,
  ApiSuccessArrayResponse,
} from '@common/decorators/api-response.decorator';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { PlaceQueryDto } from '@modules/places/core/dto/place-query.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';

@ApiTags('Place')
@Controller({ path: 'place', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(CacheInterceptor)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post()
  @Permissions(PERMISSIONS.PLACE.ADD)
  @ApiOperation({ summary: 'Create a new place' })
  @ApiSuccessResponse(PlaceEntity)
  async create(@Body() createPlaceDto: CreatePlaceDto): Promise<PlaceEntity> {
    return this.placeService.create(createPlaceDto);
  }

  @Get()
  @Permissions(PERMISSIONS.PLACE.VIEW)
  @ApiOperation({ summary: 'Get all places' })
  @ApiSuccessArrayResponse(PlaceEntity)
  async findAll(@Query() query: PlaceQueryDto): Promise<PaginatedResponseDto<PlaceEntity>> {
    return this.placeService.findAll(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PLACE.VIEW)
  @ApiOperation({ summary: 'Get place by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(PlaceEntity)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PlaceEntity> {
    return this.placeService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PLACE.UPDATE)
  @ApiOperation({ summary: 'Update place' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(PlaceEntity)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlaceDto: UpdatePlaceDto,
  ): Promise<PlaceEntity> {
    return this.placeService.update(id, updatePlaceDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PLACE.DELETE)
  @ApiOperation({ summary: 'Delete place (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(PlaceEntity)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<PlaceEntity> {
    return this.placeService.remove(id);
  }
}
