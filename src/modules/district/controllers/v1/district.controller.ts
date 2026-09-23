import {Controller, Delete, Get, Patch, Post, UseGuards} from '@nestjs/common';   

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



@ApiTags('District')
@Controller({ path: 'district', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)  
export class DistrictController {
    constructor(private readonly districtService: DistrictService) {}

    @Post()
    @Permissions(PERMISSIONS.DISTRICT.ADD)
    @ApiOperation({ summary: 'Create a new district' })
    @ApiSuccessResponse(DistrictEntity)
    createDistrict() {
    
    }

    @Get()
    @Permissions(PERMISSIONS.DISTRICT.VIEW)
    @ApiOperation({ summary: 'Get all districts' })
    @ApiSuccessArrayResponse(DistrictEntity)
    getAllDistricts() {
        
    }

    @Get(':id')
    @Permissions(PERMISSIONS.DISTRICT.VIEW)
    @ApiOperation({ summary: 'Get district by ID' })
    @ApiSuccessResponse(DistrictEntity)
    getDistrictById() {

    }

    @Patch(':id')
    @Permissions(PERMISSIONS.DISTRICT.UPDATE)
    @ApiOperation({ summary: 'Update district' })
    @ApiSuccessResponse(DistrictEntity)
    updateDistrict() {

    }

    @Delete(':id')
    @Permissions(PERMISSIONS.DISTRICT.DELETE)
    @ApiOperation({ summary: 'Delete district' })
    @ApiSuccessResponse(DistrictEntity)
    deleteDistrict() {
        
    }


}




