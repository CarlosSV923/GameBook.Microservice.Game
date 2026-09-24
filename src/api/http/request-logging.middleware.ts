import { Injectable, Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { RequestWithId } from './request-id.js';

type RequestWithUser = RequestWithId & {
  user?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAuthenticatedUserId(request: RequestWithUser): string | undefined {
  if (typeof request.user !== 'object' || request.user === null) {
    return undefined;
  }

  const user = request.user as Record<string, unknown>;
  const userId = user.userId ?? user.sub ?? user.id;
  return typeof userId === 'string' && uuidPattern.test(userId)
    ? userId
    : undefined;
}

@Injectable()
export class RequestLoggingMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = performance.now();

    response.once('finish', () => {
      const statusCode = response.statusCode;
      const userId = getAuthenticatedUserId(request as RequestWithUser);
      const record = {
        timestamp: new Date().toISOString(),
        level:
          statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
        message: 'HTTP request completed',
        requestId: (request as Partial<RequestWithId>).requestId,
        operation: `${request.method} ${request.path}`,
        result: statusCode < 400 ? 'success' : 'error',
        durationMs: Math.round(performance.now() - startedAt),
        statusCode,
        ...(userId ? { userId } : {}),
      };

      const serializedRecord = JSON.stringify(record);
      if (statusCode >= 500) {
        this.logger.error(serializedRecord);
      } else if (statusCode >= 400) {
        this.logger.warn(serializedRecord);
      } else {
        this.logger.log(serializedRecord);
      }
    });

    next();
  }
}
