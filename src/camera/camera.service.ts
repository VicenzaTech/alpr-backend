import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { Repository } from 'typeorm';
import { cameraResponseType } from './dto/camera.response';
import { Camera } from 'src/database/entities/gate.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CameraService {
  constructor(
    @InjectRepository(Camera)
    private readonly cameraRepository: Repository<Camera>,
  ) {}

  async create(createCameraDto: CreateCameraDto): Promise<cameraResponseType> {
    const foundCamera = await this.cameraRepository.findOne({
      where: {
        code: createCameraDto.code,
      },
    });
    if (foundCamera)
      throw new BadRequestException(
        `Camera với code ${createCameraDto.code} đã tồn tại!`,
      );
    const newCamera = this.cameraRepository.create({
      ...createCameraDto,
    });
    const saved = await this.cameraRepository.save(newCamera);

    return this.mapCameraPayload(saved);
  }

  // public api for operator
  async getList() {
    const where = { isActive: true };
    const listCamera = await this.cameraRepository.find({ where });

    return listCamera.map((camera) => this.mapCameraPayload(camera));
  }

  async findAll() {
    const listCamera = await this.cameraRepository.find();
    return listCamera.map((camera) => this.mapCameraPayload(camera));
  }

  async findOne(id: number) {
    const foundCamera = await this.ensureExistCameraById(id);
    return this.mapCameraPayload(foundCamera);
  }

  async update(id: number, updateCameraDto: UpdateCameraDto) {
    const foundCamera = await this.ensureExistCameraById(id);
    const updated = Object.assign(foundCamera, updateCameraDto);
    const saved = await this.cameraRepository.save(updated);
    return this.mapCameraPayload(saved);
  }

  async activate(id: number) {
    const foundCamera = await this.ensureExistCameraById(id);
    if (foundCamera.isActive === true)
      throw new BadRequestException('Camera vẫn đang hoạt động trước đó');
    foundCamera.isActive = true;
    const saved = await this.cameraRepository.save(foundCamera);
    return this.mapCameraPayload(saved);
  }

  async inActivate(id: number) {
    const foundCamera = await this.ensureExistCameraById(id);
    if (foundCamera.isActive === false)
      throw new BadRequestException('Camera đã ngừng hoạt động trước đó');
    foundCamera.isActive = false;
    const saved = await this.cameraRepository.save(foundCamera);
    return this.mapCameraPayload(saved);
  }

  remove(id: number) {
    return `This action removes a #${id} camera`;
  }

  private async ensureExistCameraByCode(code: string) {
    // Logic to ensure a camera with the given code exists
    const foundCamera = await this.cameraRepository.findOne({
      where: { code },
    });
    if (!foundCamera) {
      throw new Error(`Camera với mã code:${code} không tồn tại`);
    }
    return foundCamera;
  }

  private async ensureExistCameraById(id: number) {
    const foundCamera = await this.cameraRepository.findOne({
      where: { id },
    });
    if (!foundCamera) {
      throw new Error(`Camera với mã code:${id} không tồn tại`);
    }
    return foundCamera;
  }

  // MAPPING PAYLOAD FOR RESPONSE
  private mapCameraPayload(camera: Partial<Camera>): cameraResponseType {
    return {
      id: camera.id!,
      code: camera.code!,
      name: camera.name!,
      rtspUrl: camera.rtspUrl!,
      isActive: camera.isActive!,
      createdAt: camera.createdAt!,
    };
  }
}
