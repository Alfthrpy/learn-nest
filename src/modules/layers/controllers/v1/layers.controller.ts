import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/constants/permissions.constant';
import {
  ApiSuccessResponse,
  ApiSuccessArrayResponse,
} from '@common/decorators/api-response.decorator';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CreateLayerDto } from '@modules/layers/core/dto/create-layer.dto';
import { UpdateLayerDto } from '@modules/layers/core/dto/update-layer.dto';
import { LayerEntity } from '@modules/layers/core/entities/layer.entity';
import { LayersService } from '@modules/layers/layers.service';

@ApiTags('Layers')
@Controller({ path: 'layers', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LayersController {
  constructor(private readonly layersService: LayersService) {}

  @Post()
  @Permissions(PERMISSIONS.LAYER.ADD)
  @ApiOperation({ summary: 'Create a new layer' })
  @ApiSuccessResponse(LayerEntity)
  async create(@Body() createLayerDto: CreateLayerDto): Promise<LayerEntity> {
    return this.layersService.create(createLayerDto);
  }

  @Get()
  @Permissions(PERMISSIONS.LAYER.VIEW)
  @ApiOperation({ summary: 'Get all layers' })
  @ApiSuccessArrayResponse(LayerEntity)
  async findAll() {
    return this.layersService.findAll();
  }

  @Get(':id')
  @Permissions(PERMISSIONS.LAYER.VIEW)
  @ApiOperation({ summary: 'Get layer by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(LayerEntity)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.layersService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.LAYER.UPDATE)
  @ApiOperation({ summary: 'Update layer' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(LayerEntity)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLayerDto: UpdateLayerDto,
  ): Promise<LayerEntity> {
    return this.layersService.update(id, updateLayerDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.LAYER.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete layer (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Layer soft-deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.layersService.remove(id);
  }
}
