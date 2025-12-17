import { Module } from '@nestjs/common';
import {
  AuthController,
  AuthV2Controller,
  AuthV3Controller,
} from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthV2Service } from './auth-v2.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthV3Service } from './auth-v3.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import type { StringValue } from 'ms';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ??
          '1h') as StringValue | number;
        return {
          secret:
            configService.get<string>('JWT_SECRET') ??
            configService.get<string>('BETTER_AUTH_SECRET') ??
            'change-me',
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController, AuthV3Controller],
  providers: [
    AuthService,
    FirebaseAuthService,
    FirebaseAuthGuard,
    AuthV3Service,
    LocalStrategy,
    JwtStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    GoogleStrategy,
    FacebookStrategy,
    GoogleAuthGuard,
    FacebookAuthGuard,
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
