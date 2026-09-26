import { Module } from '@nestjs/common';
import { DistrictService } from './district.service';
import { DistrictController } from './controllers/v1/district.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register({ ttl: 15 * 60 * 1000 })],
  controllers: [DistrictController],
  providers: [DistrictService],
  exports: [DistrictService],
})
export class DistrictModule {}
