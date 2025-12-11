import { IsNotEmpty, IsString } from "class-validator";

export class CreateCameraDto {
    @IsString()
    @IsNotEmpty({ message: 'Camera code không được để trống' })
    code: string;
    @IsString()
    @IsNotEmpty({ message: 'Camera name không được để trống' })
    name: string;
    @IsString()
    @IsNotEmpty({ message: 'Camera location không được để trống' })
    location: string;
    @IsString()
    @IsNotEmpty({ message: 'Camera rtspUrl không được để trống' })
    rtspUrl: string;
}

