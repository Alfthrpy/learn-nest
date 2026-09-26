import { Module } from '@nestjs/common';
import { PlaceService } from './place.service';
import { PlaceController } from './controller/v1/place.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register({ ttl: 15 * 60 * 1000 })],
  controllers: [PlaceController],
  providers: [PlaceService],
})
export class PlaceModule {}
