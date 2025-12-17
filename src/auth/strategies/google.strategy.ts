import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthV3Service } from '../auth-v3.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GoogleStrategy.name);
    private readonly isConfigured: boolean;

    constructor(
        configService: ConfigService,
        private readonly authV3Service: AuthV3Service,
    ) {
        const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') ?? 'http://localhost:5555/api/v3/auth/google/callback';

        super({
            clientID: clientID ?? '',
            clientSecret: clientSecret ?? '',
            callbackURL,
            scope: ['email', 'profile'],
        });

        this.isConfigured = Boolean(clientID && clientSecret);
        if (!this.isConfigured) {
            this.logger.warn('Google OAuth credentials missing. Google login endpoints will be disabled.');
        }
    }

    async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
        if (!this.isConfigured) {
            done(new Error('Google OAuth is not configured'), false);
            return;
        }

        try {
            const user = await this.authV3Service.validateOAuthUser({
                provider: 'google',
                providerId: profile.id,
                email: profile.emails?.[0]?.value,
                fullName: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
        } catch (error) {
            done(error, false);
        }
    }
}
