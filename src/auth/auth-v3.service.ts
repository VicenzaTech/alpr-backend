import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity';
import { LocalRegisterDto } from './dto/local-register.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { randomUUID } from 'crypto';
import { hash, compare } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from './types/oauth-profile.interface';

@Injectable()
export class AuthV3Service {
    private readonly logger = new Logger(AuthV3Service.name);
    private readonly jwtExpiresIn: string | number;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h';
    }

    async registerLocal(dto: LocalRegisterDto): Promise<{ user: AuthenticatedUser }> {
        const normalizedEmail = dto.email.toLowerCase();
        const existing = await this.userRepo.findOne({ where: { email: normalizedEmail } });
        if (existing) {
            throw new ConflictException('Email đã được sử dụng');
        }

        if (dto.phone) {
            const phoneExists = await this.userRepo.findOne({ where: { phone: dto.phone } });
            if (phoneExists) {
                throw new ConflictException('Số điện thoại đã được sử dụng');
            }
        }

        const passwordHash = await hash(dto.password, 10);

        const user = this.userRepo.create({
            id: randomUUID(),
            email: normalizedEmail,
            passwordHash,
            fullName: dto.fullName.trim(),
            phone: dto.phone ?? null,
            username: dto.username ?? this.buildUsernameFromEmail(normalizedEmail),
            avatarUrl: dto.avatarUrl ?? null,
            role: dto.role ?? UserRole.OPERATOR,
            position: dto.position ?? 'operator',
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            status: UserStatus.ACTIVE,
            authProvider: 'local',
        } as Partial<User>);

        const saved = await this.userRepo.save(user);
        this.logger.debug(`Created new local user ${saved.id}`);

        return { user: this.sanitizeUser(saved) };
    }

    async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
        const normalizedEmail = email?.toLowerCase();
        if (!normalizedEmail || !password) {
            throw new UnauthorizedException('Email hoặc mật khẩu không hợp lệ');
        }

        const user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
        if (!user?.passwordHash) {
            throw new UnauthorizedException('Sai thông tin đăng nhập');
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Sai thông tin đăng nhập');
        }
        return this.sanitizeUser(user);
    }

    async login(user: AuthenticatedUser): Promise<{ accessToken: string; tokenType: string; expiresIn: string | number; user: AuthenticatedUser; }> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return {
            accessToken,
            tokenType: 'Bearer',
            expiresIn: this.jwtExpiresIn,
            user,
        };
    }

    async getProfile(userId: string): Promise<AuthenticatedUser> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return this.sanitizeUser(user);
    }

    async validateOAuthUser(profile: OAuthProfile): Promise<AuthenticatedUser> {
        if (!profile.email) {
            throw new UnauthorizedException(`${profile.provider} không trả về email`);
        }

        const normalizedEmail = profile.email.toLowerCase();
        let user = await this.userRepo.findOne({ where: { email: normalizedEmail } });

        if (!user) {
            user = this.userRepo.create({
                id: randomUUID(),
                email: normalizedEmail,
                fullName: profile.fullName ?? this.buildUsernameFromEmail(normalizedEmail),
                username: this.buildUsernameFromEmail(normalizedEmail),
                avatarUrl: profile.avatarUrl ?? null,
                phone: null,
                role: UserRole.OPERATOR,
                position: 'operator',
                dateOfBirth: null,
                status: UserStatus.ACTIVE,
                authProvider: profile.provider,
                providerId: profile.providerId,
            } as Partial<User>);
            this.logger.debug(`Created OAuth user via ${profile.provider} (${normalizedEmail})`);
        } else {
            user = this.userRepo.merge(user, {
                fullName: profile.fullName ?? user.fullName,
                avatarUrl: profile.avatarUrl ?? user.avatarUrl,
                authProvider: profile.provider ?? user.authProvider,
                providerId: profile.providerId ?? user.providerId,
            });
            this.logger.debug(`Updated OAuth user via ${profile.provider} (${normalizedEmail})`);
        }

        const saved = await this.userRepo.save(user);
        return this.sanitizeUser(saved);
    }

    sanitizeUser(user: User): AuthenticatedUser {
        const { passwordHash, ...rest } = user;
        return rest as AuthenticatedUser;
    }

    private buildUsernameFromEmail(email: string): string {
        return email?.split('@')[0] ?? 'user';
    }
}
