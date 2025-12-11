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
import { CameraModule } from './camera/camera.module';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';

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
        /*
        DB_HOST=localhost
        DB_PORT=5432
        DB_NAME=alprdb
        DB_USER=alpruser
        DB_PASSWORD=alprpass
        */
        //    
        WinstonModule.forRoot({
            transports: [
                new transports.Console({
                    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                    format: format.combine(
                        format.timestamp(),
                        format.ms(),
                        format.errors({ stack: true }),
                        nestWinstonModuleUtilities.format.nestLike('ALPR', {
                            colors: true,
                            prettyPrint: true,
                        }),
                    ),
                }),
            ],
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST ?? 'localhost',
            port: Number(process.env.DB_PORT) ?? 5432,
            username: process.env.DB_USER ?? 'alpruser',
            password: process.env.DB_PASSWORD ?? 'alprpass',
            database: process.env.DB_NAME ?? 'alprdb',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            logging: true,
            logger: 'advanced-console',
            autoLoadEntities: true,
            synchronize: true,
        }),
        CameraModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }