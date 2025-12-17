import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthV3Service } from '../auth-v3.service';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private readonly authV3Service: AuthV3Service) {
        super({
            usernameField: 'email',
            passwordField: 'password',
        });
    }

    async validate(email: string, password: string): Promise<AuthenticatedUser> {
        return this.authV3Service.validateUser(email, password);
    }
}
