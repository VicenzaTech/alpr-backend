import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AlprController } from './alpr.controller';
import { AlprService } from './alpr.service';
import { Detection } from '../database/entities/detection.entity';
import * as multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Detection]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [AlprController],
  providers: [AlprService],
  exports: [AlprService],
})
export class AlprModule {}
