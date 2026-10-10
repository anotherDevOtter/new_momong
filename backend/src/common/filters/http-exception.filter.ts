import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const httpResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof httpResponse === 'string'
        ? httpResponse
        : (httpResponse as { message?: string | string[] })?.message
          ? Array.isArray((httpResponse as { message: string[] }).message)
            ? (httpResponse as { message: string[] }).message.join(', ')
            : ((httpResponse as { message: string }).message as string)
          : exception instanceof Error
            ? exception.message
            : '서버 오류가 발생했습니다';

    const code = (httpResponse as { error?: string })?.error;

    const where = `${request.method} ${request.originalUrl}`;
    const userId =
      (request as Request & { user?: { id?: string } }).user?.id ?? '-';

    if (status >= 500) {
      this.logger.error(
        `[${status}] ${where} user=${userId} msg=${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${status}] ${where} user=${userId} msg=${message}`);
    }

    // HttpException 이 아닌 오류(DB 등)의 원문은 로그에만 남기고 운영 응답에는 내보내지 않는다 (TODO M3)
    const publicMessage =
      !(exception instanceof HttpException) && process.env.NODE_ENV === 'production'
        ? '서버 오류가 발생했습니다'
        : message;

    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      message: publicMessage,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
