import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(
        private readonly firebaseAuthService: FirebaseAuthService,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('Authorization token is missing');
        }

        try {
            const decodedToken = await this.firebaseAuthService.verifyIdToken(token);
            request['firebaseUser'] = decodedToken;

            const user = await this.userRepo.findOne({ where: { id: decodedToken.uid } });
            if (!user) {
                throw new UnauthorizedException('User is not registered in the system');
            }

            request['user'] = user;
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new UnauthorizedException('Invalid or expired Firebase token');
        }
    }

    private extractToken(request: Request): string | null {
        const header = request.headers.authorization;
        if (!header) {
            return null;
        }

        const [type, token] = header.split(' ');
        if (type?.toLowerCase() !== 'bearer' || !token) {
            return null;
        }

        return token;
    }
}
