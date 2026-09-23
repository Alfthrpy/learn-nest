import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards} from '@nestjs/common';   

import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {DistrictService} from '../../district.service';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/constants/permissions.constant';
import {
  ApiSuccessResponse,
  ApiSuccessArrayResponse,
} from '@common/decorators/api-response.decorator';
import { DistrictEntity } from '@modules/district/core/entities/district.entity';
import { CreateDistrictDto } from '@modules/district/core/dto/create-district.dto';
import { updateDistrictDto } from '@modules/district/core/dto/update-user.dto';
import { UpdateDistrictDto } from '@modules/district/core/dto/update-district.dto';



@ApiTags('District')
@Controller({ path: 'district', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)  
export class DistrictController {
    constructor(private readonly districtService: DistrictService) {}

    @Post()
    @Permissions(PERMISSIONS.DISTRICT.ADD)
    @ApiOperation({ summary: 'Create a new district' })
    @ApiSuccessResponse(DistrictEntity)
    async create(@Body() createDistrictDto: CreateDistrictDto): Promise<DistrictEntity> {
        return this.districtService.create(createDistrictDto);
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
    async findOne(@Param('id',ParseIntPipe) id: number) {
        return this.districtService.findOne(id);
    }

    @Patch(':id')
    @Permissions(PERMISSIONS.DISTRICT.UPDATE)
    @ApiOperation({ summary: 'Update district' })
    @ApiSuccessResponse(DistrictEntity)
    async update(@Param('id',ParseIntPipe) id: number, @Body() updateDistrictDto: UpdateDistrictDto) {
        return this.districtService.update(id, updateDistrictDto);
    }

    @Delete(':id')
    @Permissions(PERMISSIONS.DISTRICT.DELETE)
    @ApiOperation({ summary: 'Delete district' })
    @ApiSuccessResponse(DistrictEntity)
    async remove(@Param('id',ParseIntPipe) id: number) {
        return this.districtService.remove(id);
    }


}




