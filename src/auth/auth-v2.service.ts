import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { FirebaseRegisterDto } from './dto/firebase-register.dto';
import { User, UserRole, UserStatus } from '../database/entities/user.entity';

interface ProfileOverrides {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  username?: string;
  position?: string;
  role?: UserRole;
}

@Injectable()
export class AuthV2Service {
  private readonly logger = new Logger(AuthV2Service.name);

  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async registerWithFirebase(dto: FirebaseRegisterDto) {
    try {
      const firebaseUser = await this.firebaseAuthService.createUser({
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        phoneNumber: dto.phone,
        avatarUrl: dto.avatarUrl,
      });

      if (dto.role) {
        await this.firebaseAuthService.setCustomUserClaims(firebaseUser.uid, {
          role: dto.role,
        });
      }

      const user = await this.upsertUserFromFirebase(
        firebaseUser.uid,
        firebaseUser.email ?? dto.email,
        {
          fullName: dto.fullName,
          phone: dto.phone,
          avatarUrl: dto.avatarUrl,
          username: dto.username,
          position: dto.position,
          role: dto.role,
        },
      );

      return {
        user,
        firebase: {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? dto.email,
          emailVerified: firebaseUser.emailVerified,
          customToken: await this.firebaseAuthService.generateCustomToken(
            firebaseUser.uid,
            {
              role: user.role,
            },
          ),
        },
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to register user with Firebase';
      this.logger.error(
        `Failed to register Firebase user: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException(message);
    }
  }

  async loginWithFirebase(dto: FirebaseAuthDto) {
    const decoded = await this.firebaseAuthService.verifyIdToken(dto.idToken);
    if (!decoded?.uid || !decoded.email) {
      throw new UnauthorizedException('Firebase token is missing uid or email');
    }

    const user = await this.upsertUserFromFirebase(decoded.uid, decoded.email, {
      fullName: dto.fullName ?? decoded.name,
      phone: dto.phone ?? decoded.phone_number,
      avatarUrl: dto.avatarUrl ?? decoded.picture,
      username: dto.username ?? this.buildUsernameFromEmail(decoded.email),
      position: dto.position,
      role: dto.role,
    });

    const customClaims = { role: user.role };
    await this.firebaseAuthService.setCustomUserClaims(
      decoded.uid,
      customClaims,
    );
    const customToken = await this.firebaseAuthService.generateCustomToken(
      decoded.uid,
      customClaims,
    );

    return {
      user,
      firebase: {
        uid: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified,
        signInProvider: decoded.firebase?.sign_in_provider,
        customToken,
      },
    };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async upsertUserFromFirebase(
    uid: string,
    email: string,
    overrides: ProfileOverrides,
  ): Promise<User> {
    let user = await this.userRepo.findOne({ where: { id: uid } });

    if (!user) {
      user = this.userRepo.create({
        id: uid,
        email,
        fullName: overrides.fullName ?? this.buildUsernameFromEmail(email),
        phone: overrides.phone ?? null,
        username: overrides.username ?? this.buildUsernameFromEmail(email),
        avatarUrl: overrides.avatarUrl ?? null,
        role: overrides.role ?? UserRole.OPERATOR,
        position: overrides.position ?? 'operator',
        status: UserStatus.ACTIVE,
      } as Partial<User>);
      this.logger.debug(`Created new user from Firebase uid=${uid}`);
    } else {
      user = this.userRepo.merge(user, {
        fullName: overrides.fullName ?? user.fullName,
        phone: overrides.phone ?? user.phone,
        username: overrides.username ?? user.username,
        avatarUrl: overrides.avatarUrl ?? user.avatarUrl,
        position: overrides.position ?? user.position,
        role: overrides.role ?? user.role,
      });
      this.logger.debug(`Updated user profile from Firebase uid=${uid}`);
    }
    return this.userRepo.save(user);
  }

  private buildUsernameFromEmail(email: string): string {
    if (!email) return 'user';
    return email.split('@')[0];
  }
}
