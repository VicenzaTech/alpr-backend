import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from 'src/database/entities/user.entity';
    
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('fullName') fullName: string,
        @Body('phone') phone: string,
        @Body('role') role: UserRole,
        @Body('position') position: string,
        @Body('dateOfBirth') dateOfBirth: Date, // ISO string
    ) {
        return this.authService.register(
            email,
            password,
            fullName,
            phone,
            role,
            position,
            dateOfBirth
        );
    }

    @Post('login')
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
    ) {
        if (!email || !password) {
            throw new UnauthorizedException('Email và mật khẩu là bắt buộc');
        }

        return await this.authService.login(email, password);
    }

    @Post('logout')
    async logout(@Body('refresh_token') refresh_token: string) {
        if (!refresh_token) {
            throw new UnauthorizedException('Refresh token là bắt buộc');
        }

        return await this.authService.logout(refresh_token);
    }
}