import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseInterceptors,
    UploadedFiles,
    Logger,
} from '@nestjs/common';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AlprService } from './alpr.service';
import { DetectionStatus } from './entities/detection.entity';

@Controller('api/alpr')
export class AlprController {
    private readonly logger = new Logger(AlprController.name);

    constructor(private readonly alprService: AlprService) { }

    @Post('detections')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'full_image', maxCount: 1 },
            { name: 'cropped_image', maxCount: 1 },
        ]),
    )
    async createDetection(
        @Body() body: any,
        @UploadedFiles() files: any,
    ) {
        this.logger.log('Received detection from ALPR service');
        this.logger.log(`Plate: ${body.plate_text}, Camera: ${body.camera_id}`);

        const detection = await this.alprService.saveDetection(body, files);

        return {
            success: true,
            detection_id: detection.id,
            message: 'Detection saved successfully',
            requires_approval: detection.status === DetectionStatus.PENDING_APPROVAL,
        };
    }

    @Get('detections')
    async getDetections(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        return this.alprService.findAll(pageNum, limitNum);
    }

    @Get('detections/:id')
    async getDetection(@Param('id') id: string) {
        return this.alprService.findOne(parseInt(id, 10));
    }

    @Patch('detections/:id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: DetectionStatus,
    ) {
        return this.alprService.updateStatus(parseInt(id, 10), status);
    }
}
