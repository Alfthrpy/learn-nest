import { Module } from '@nestjs/common';
import { LayersService } from './layers.service';
import { LayersController } from './controllers/v1/layers.controller';


@Module({
  controllers: [LayersController],
  providers: [LayersService],
})
export class LayersModule {}
