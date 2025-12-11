import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Detection, DetectionStatus } from './entities/detection.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AlprService {
  private readonly logger = new Logger(AlprService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Detection)
    private readonly detectionRepo: Repository<Detection>,
  ) {
    // Tạo thư mục uploads nếu chưa có
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`Created uploads directory: ${this.uploadsDir}`);
    }
  }

  async saveDetection(data: any, files: any): Promise<Detection> {
    const timestamp = new Date(data.timestamp);
    const detectionFolder = path.join(
      this.uploadsDir,
      timestamp.toISOString().split('T')[0], // YYYY-MM-DD
    );

    // Tạo folder theo ngày
    if (!fs.existsSync(detectionFolder)) {
      fs.mkdirSync(detectionFolder, { recursive: true });
    }

    // Lưu full image
    let fullImageUrl: string | null = null;
    if (files.full_image && files.full_image[0]) {
      const fullImageName = `full_${Date.now()}.jpg`;
      const fullImagePath = path.join(detectionFolder, fullImageName);
      fs.writeFileSync(fullImagePath, files.full_image[0].buffer);
      fullImageUrl = `/uploads/${timestamp.toISOString().split('T')[0]}/${fullImageName}`;
      this.logger.log(`Saved full image: ${fullImageUrl}`);
    }

    // Lưu cropped image
    let croppedImageUrl: string | null = null;
    if (files.cropped_image && files.cropped_image[0]) {
      const croppedImageName = `crop_${Date.now()}.jpg`;
      const croppedImagePath = path.join(detectionFolder, croppedImageName);
      fs.writeFileSync(croppedImagePath, files.cropped_image[0].buffer);
      croppedImageUrl = `/uploads/${timestamp.toISOString().split('T')[0]}/${croppedImageName}`;
      this.logger.log(`Saved cropped image: ${croppedImageUrl}`);
    }

    // Parse bbox from string to object
    let bbox = data.bbox;
    if (typeof bbox === 'string') {
      try {
        // Convert Python dict format (single quotes) to JSON format (double quotes)
        const jsonString = bbox.replace(/'/g, '"');
        bbox = JSON.parse(jsonString);
      } catch (error) {
        this.logger.error(`Failed to parse bbox: ${bbox}`, error);
        bbox = { x1: 0, y1: 0, x2: 0, y2: 0 };
      }
    }

    // Đảm bảo bbox không bao giờ là null
    if (!bbox) {
      this.logger.warn('bbox is null or undefined, using default value');
      bbox = { x1: 0, y1: 0, x2: 0, y2: 0 };
    }

    // Parse metadata from string if needed
    let metadata = data.metadata;
    if (typeof metadata === 'string' && metadata.trim()) {
      try {
        metadata = JSON.parse(metadata);
      } catch (error) {
        this.logger.warn(`Failed to parse metadata: ${metadata}`, error);
        metadata = null;
      }
    } else if (!metadata) {
      metadata = null;
    }

    // Tạo detection record
    const detection = this.detectionRepo.create({
      plate_text: data.plate_text,
      formatted_text: data.formatted_text,
      confidence: parseFloat(data.confidence),
      detection_confidence: parseFloat(data.detection_confidence),
      bbox,
      camera_id: data.camera_id,
      sensor_id: data.sensor_id,
      timestamp,
      status: data.status || DetectionStatus.PENDING_APPROVAL,
      full_image_url: fullImageUrl,
      cropped_image_url: croppedImageUrl,
      image_path: data.image_path,
      metadata,
    } as DeepPartial<Detection>);

    await this.detectionRepo.save(detection);
    this.logger.log(
      `Detection saved: ${detection.plate_text} (ID: ${detection.id})`,
    );

    return detection;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Detection[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.detectionRepo.findAndCount({
      order: { timestamp: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Detection> {
    const detection = await this.detectionRepo.findOne({ where: { id } });
    if (!detection) {
      throw new Error(`Detection with ID ${id} not found`);
    }
    return detection;
  }

  async updateStatus(id: number, status: DetectionStatus): Promise<Detection> {
    await this.detectionRepo.update(id, { status });
    return this.findOne(id);
  }
}