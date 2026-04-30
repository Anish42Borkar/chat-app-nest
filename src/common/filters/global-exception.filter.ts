import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.log('Exception caught by GlobalExceptionFilter:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res: any = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else {
        message = res.message || message;
        code = res.error || code;
        details = res;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack;
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      error: {
        code,
        details,
      },
    });
  }
}
