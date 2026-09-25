import { Module } from '@nestjs/common';
import { DistrictService } from './district.service';
import { DistrictController } from './controllers/v1/district.controller';
import { CacheModule } from '@nestjs/cache-manager';


@Module({
  imports : [CacheModule.register()],
  controllers: [DistrictController],
  providers: [DistrictService],
  exports: [DistrictService],
})
export class DistrictModule {}
