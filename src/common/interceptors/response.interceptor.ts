// src/common/interceptors/response.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        // if already formatted, return as is
        if (data?.success !== undefined) return data;

        return {
          success: true,
          message: data?.message || 'Success',
          data: data?.data ?? data ?? null,
          error: null,
        };
      }),
    );
  }
}
