import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HandleExceptionFilter } from './common/filters/handle-exception/handle-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response/response.interceptor';

async function bootstrap() {
    console.log('Starting server...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Serve static files from uploads directory
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads',
    });
    // Enable CORS
    app.enableCors({
        origin: 'http://localhost:3000', // Your frontend URL
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true, // If you need to allow credentials
    });
    // Sync users từ Supabase về database
    try {
        const authService = app.get(require('./auth/auth.service').AuthService);
        const userService = app.get(require('./user/user.service').UserService);
        const { UserRole } = require('./database/entities/user.entity');
        const repo = userService['userRepo'];
        const supabase = authService['supabase'];

        // Fetch tất cả users từ Supabase Auth
        const {
            data: { users },
            error,
        } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('Error fetching users from Supabase:', error);
        } else {
            console.log(`Found ${users.length} users in Supabase Auth`);

            for (const user of users) {
                const exist = await repo.findOne({ where: { id: user.id } });
                if (!exist) {
                    // Sync user vào database với role mặc định là admin
                    await repo.save({
                        id: user.id,
                        email: user.email,
                        fullName: user.user_metadata?.full_name || user.email.split('@')[0],
                        role: UserRole.ADMIN,
                        position: 'admin',
                        phone: user.phone || null,
                        avatarUrl: null,
                        dateOfBirth: null,
                    });
                    console.log(`Synced asuser: ${user.email}`);
                }
            }
        }
    } catch (err) {
        console.error('Sync users sc error:', err);
    }
    const winston = app.get(WINSTON_MODULE_NEST_PROVIDER);
    app.setGlobalPrefix('/api');
    app.enableCors({
        origin: ['http://192.168.221.17'],
        credentials: true
    })
    app.useLogger(winston);
    app.useGlobalFilters(new HandleExceptionFilter(winston));
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
    console.error('Failed to start the application:', err);
    process.exit(1);
});
