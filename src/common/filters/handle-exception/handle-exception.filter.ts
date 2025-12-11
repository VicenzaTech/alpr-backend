import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Catch()
export class HandleExceptionFilter<T> implements ExceptionFilter {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService
    ) { }
    catch(exception: T, host: ArgumentsHost) {
        if (host.getType() !== 'http') {
            const nonHttpStack =
                exception instanceof Error ? exception.stack : undefined;
            this.logger.error('Non-HTTP exception intercepted', nonHttpStack);
            throw exception;
        }
        const ctx = host.switchToHttp();
        const request = ctx.getResponse<Request>();
        const response = ctx.getResponse<Response>();
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        let message = 'Lỗi hệ thống, vui lòng thử lại sau.'
        if (exception instanceof HttpException) {
            statusCode = exception.getStatus()
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
            }
            else if (typeof res === 'object' && res !== null && 'message' in res) {
                const resMessage = (res as any).message;
                if (Array.isArray(resMessage)) {
                    message = resMessage.join(', ');
                }
                else {
                    message = exception.message
                }
            }
            else message = exception.message;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        this.logger.error(`[HTTP Exception]: ${message}`, exception instanceof Error ? exception.stack : undefined);
        response.status(statusCode).json({
            statusCode,
            message,
            timestamp: new Date().toISOString(),
        })
    }
}
