import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AlprModule } from './alpr/alpr.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';

@Module({
  imports: [
    AuthModule,
    UserModule,
    AlprModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'uploads'),
    //   serveRoot: '/uploads',
    // }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entities/**/*.js', 'src/**/*.entities/**/*.ts'],
      synchronize: true,
      logging: true,
      logger: 'advanced-console',
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}