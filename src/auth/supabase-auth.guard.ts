import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService, private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) return false;

    try {
      const user = await this.supabase.getUserFromToken(token);
      const userFromDB = await this.userService.findOne(user.id);
      req.user = userFromDB;
      return true;
    } catch {
      return false;
    }
  }
}