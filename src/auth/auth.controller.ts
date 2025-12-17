import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from 'src/database/entities/user.entity';
import { SyncDto } from './dto/sync.dto';
import { AuthV2Service } from './auth-v2.service';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { FirebaseRegisterDto } from './dto/firebase-register.dto';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import type { Request, Response } from 'express';
import { AuthV3Service } from './auth-v3.service';
import { LocalRegisterDto } from './dto/local-register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  async sync(@Body() sync: SyncDto) {
    return await this.authService.sync(sync);
  }

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
      dateOfBirth,
    );
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    return await this.authService.login(email, password);
  }

  @Post('logout')
  async logout(@Body('refresh_token') refresh_token: string) {
    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    return await this.authService.logout(refresh_token);
  }
}

@Controller('v2/auth')
export class AuthV2Controller {
  constructor(private readonly authV2Service: AuthV2Service) {}

  @Post('register')
  async register(@Body() payload: FirebaseRegisterDto) {
    return this.authV2Service.registerWithFirebase(payload);
  }

  @Post('login')
  async login(@Body() payload: FirebaseAuthDto) {
    if (!payload?.idToken) {
      throw new UnauthorizedException('Firebase idToken is required');
    }
    return this.authV2Service.loginWithFirebase(payload);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getProfile(@Req() req: Request) {
    const user = req['user'] as { id?: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('User payload is missing');
    }
    return this.authV2Service.getProfile(user.id);
  }
}

@Controller('v3/auth')
export class AuthV3Controller {
  constructor(private readonly authV3Service: AuthV3Service) {}

  @Post('register')
  async register(@Body() payload: LocalRegisterDto) {
    return this.authV3Service.registerLocal(payload);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.authV3Service.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.authV3Service.getProfile(user.id);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleLogin() {
    return { message: 'Redirecting to Google OAuth' };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as AuthenticatedUser;
    const authPayload = await this.authV3Service.login(user);
    const state = decodeOAuthState(req.query?.state);

    if (state && trySendOAuthPopup(res, 'google', authPayload, state)) {
      return;
    }

    return authPayload;
  }

  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  async facebookLogin() {
    return { message: 'Redirecting to Facebook OAuth' };
  }

  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  async facebookCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as AuthenticatedUser;
    const authPayload = await this.authV3Service.login(user);
    const state = decodeOAuthState(req.query?.state);

    if (state && trySendOAuthPopup(res, 'facebook', authPayload, state)) {
      return;
    }

    return authPayload;
  }
}

type OAuthState = {
  mode?: string;
  origin?: string;
  provider?: string;
};

const decodeOAuthState = (rawState: unknown): OAuthState | null => {
  if (!rawState || typeof rawState !== 'string') {
    return null;
  }

  try {
    const json = Buffer.from(rawState, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as OAuthState;
    if (parsed.origin) {
      try {
        const normalized = new URL(parsed.origin);
        parsed.origin = normalized.origin;
      } catch {
        parsed.origin = undefined;
      }
    }
    return parsed;
  } catch {
    return null;
  }
};

const trySendOAuthPopup = (
  res: Response,
  provider: string,
  payload: unknown,
  state: OAuthState,
) => {
  if (state.mode !== 'popup' || !state.origin) {
    return false;
  }

  const html = buildPopupHtml(provider, payload, state.origin);
  res.status(200).type('html').send(html);
  return true;
};

const buildPopupHtml = (provider: string, payload: unknown, origin: string) => {
  const safePayload = JSON.stringify(payload).replace(/</g, '\\u003c');
  const safeProvider = JSON.stringify(provider);
  const safeOrigin = JSON.stringify(origin);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>${provider} OAuth</title>
</head>
<body>
    <p>Đang xử lý đăng nhập ${provider}...</p>
    <script>
        (function () {
            const message = { type: 'oauth:result', provider: ${safeProvider}, payload: ${safePayload} };
            const targetOrigin = ${safeOrigin};
            if (window.opener) {
                try {
                    window.opener.postMessage(message, targetOrigin);
                } catch (err) {
                    console.error('Failed to notify opener', err);
                }
            }
            window.close();
        })();
    </script>
</body>
</html>`;
};
