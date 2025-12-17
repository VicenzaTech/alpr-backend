import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, UserRecord, getAuth } from 'firebase-admin/auth';

interface FirebaseCreateUserParams {
    email: string;
    password: string;
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
}

@Injectable()
export class FirebaseAuthService {
    private readonly logger = new Logger(FirebaseAuthService.name);
    private readonly app: App;

    constructor(private readonly configService: ConfigService) {
        // this.app = this.initializeFirebaseApp();
    }

    private initializeFirebaseApp(): App {
        const apps = getApps();
        if (apps.length > 0) {
            return getApp();
        }

        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Firebase credentials are not configured');
        }

        privateKey = privateKey.replace(/\\n/g, '\n');

        this.logger.log('Initializing Firebase Admin SDK');

        return initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    }

    verifyIdToken(token: string): Promise<DecodedIdToken> {
        return getAuth(this.app).verifyIdToken(token, true);
    }

    async createUser(params: FirebaseCreateUserParams): Promise<UserRecord> {
        const auth = getAuth(this.app);
        return auth.createUser({
            email: params.email,
            password: params.password,
            displayName: params.fullName,
            phoneNumber: params.phoneNumber,
            photoURL: params.avatarUrl,
        });
    }

    async setCustomUserClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
        const auth = getAuth(this.app);
        await auth.setCustomUserClaims(uid, claims);
    }

    async generateCustomToken(uid: string, claims?: Record<string, unknown>): Promise<string> {
        const auth = getAuth(this.app);
        return auth.createCustomToken(uid, claims);
    }
}
