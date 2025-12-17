import { Module } from '@nestjs/common';
import { CameraService } from './camera.service';
import { CameraController } from './camera.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camera } from 'src/database/entities/gate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Camera])],
  controllers: [CameraController],
  providers: [CameraService],
})
export class CameraModule {}
