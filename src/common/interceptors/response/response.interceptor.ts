import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((payload) => {
        if (context.getType() !== 'http') return next.handle();

        const request = context.switchToHttp().getRequest();
        const timestamp = new Date().toISOString();
        const path = request.url;
        const success = true;

        const hasData =
          typeof payload == 'object' && Object.keys(payload).includes('data');
        const hasMeta =
          typeof payload == 'object' && Object.keys(payload).includes('meta');

        return {
          success,
          timestamp,
          path,
          data: hasData ? payload.data : payload,
          meta: hasMeta ? payload.meta : undefined,
        };
      }),
    );
  }
}
