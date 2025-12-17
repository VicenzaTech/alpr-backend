import { User } from '../../database/entities/user.entity';

export type AuthenticatedUser = Omit<User, 'passwordHash'>;
