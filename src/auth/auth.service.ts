// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../user/entity/user.entity';

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key để xác thực Supabase
    );
  }

  async register(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: UserRole,
    position?: string,
    dateOfBirth?: Date,
  ): Promise<any> {
    // Kiểm tra role hợp lệ
    // if (![UserRole.ADMIN].includes(role)) {
    //   throw new UnauthorizedException('Vai trò không hợp lệ');
    // }
  
    // Kiểm tra số điện thoại đã tồn tại
    const phoneExists = await this.userRepo.findOne({ where: { phone } });
    if (phoneExists) {
      throw new UnauthorizedException('Số điện thoại đã được sử dụng');
    }
  
    // Kiểm tra email đã tồn tại
    const emailExists = await this.userRepo.findOne({ where: { email } });
    if (emailExists) {
      throw new UnauthorizedException('Email đã được sử dụng');
    }
  
    // Gọi Supabase để đăng ký
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) throw new UnauthorizedException(error.message);
  
    const { user } = data;
  
    // Tạo user trong hệ thống
    const newUser = this.userRepo.create({
      id: user.id,
      email: user.email,
      position,
      phone,
      role,
      fullName,
      dateOfBirth,
    });
  
    await this.userRepo.save(newUser);
  
    return {
      id: user.id,
      email: user.email,
      phone,
      role,
      dateOfBirth,
    };
  }

  async login(email: string, password: string): Promise<any> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new UnauthorizedException(error.message);

    const { user, session } = data;
    const userFromDB = await this.userRepo.findOne({ where: { id: user.id } });
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: userFromDB?.role,
      },
    };
  }

  async logout(refresh_token: string): Promise<any> {
    const { error } = await this.supabase.auth.signOut({
      refreshToken: refresh_token,
    });

    if (error) throw new UnauthorizedException(error.message);

    return { message: 'Logout successful' };
  }
}