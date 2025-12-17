import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthV3Service } from '../auth-v3.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookStrategy.name);
  private readonly isConfigured: boolean;

  constructor(
    configService: ConfigService,
    private readonly authV3Service: AuthV3Service,
  ) {
    const clientID = configService.get<string>('FACEBOOK_CLIENT_ID');
    const clientSecret = configService.get<string>('FACEBOOK_CLIENT_SECRET');
    const callbackURL =
      configService.get<string>('FACEBOOK_CALLBACK_URL') ??
      'http://localhost:5555/api/v3/auth/facebook/callback';

    super({
      clientID: clientID ?? '',
      clientSecret: clientSecret ?? '',
      callbackURL,
      scope: ['email'],
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    });

    this.isConfigured = Boolean(clientID && clientSecret);
    if (!this.isConfigured) {
      this.logger.warn(
        'Facebook OAuth credentials missing. Facebook login endpoints will be disabled.',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: any, info?: any) => void,
  ) {
    if (!this.isConfigured) {
      done(new Error('Facebook OAuth is not configured'), false);
      return;
    }

    try {
      const user = await this.authV3Service.validateOAuthUser({
        provider: 'facebook',
        providerId: profile.id,
        email: profile.emails?.[0]?.value,
        fullName: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (error) {
      done(error as Error, false);
    }
  }
}
