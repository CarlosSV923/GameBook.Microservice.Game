import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { resolveRequestId, type RequestWithId } from './request-id.js';

type ErrorDetail = {
  field: string;
  reason: string;
};

type ErrorResponse = {
  code: string;
  message: string;
  requestId: string;
  details?: ErrorDetail[];
};

const publicMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Request validation failed.',
  TOKEN_MISSING: 'Authentication is required.',
  TOKEN_INVALID: 'Authentication is not valid.',
  TOKEN_EXPIRED: 'Authentication has expired.',
  SESSION_REVOKED: 'Authentication is no longer valid.',
  FAVORITE_NOT_FOUND: 'Favorite not found.',
  FAVORITE_ALREADY_EXISTS: 'The game is already in your favorites.',
  AUTHUSER_UNAVAILABLE: 'Authentication service is temporarily unavailable.',
  INTERNAL_ERROR: 'An unexpected error occurred.',
};

const statusCodes: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'TOKEN_INVALID',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'AUTHUSER_UNAVAILABLE',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readDetails(value: unknown): ErrorDetail[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const details = value.filter(isRecord).flatMap((detail) => {
    const field = detail.field;
    const reason = detail.reason;

    if (typeof field !== 'string' || typeof reason !== 'string') {
      return [];
    }

    return [{ field, reason }];
  });

  return details.length > 0 ? details : undefined;
}

function readPublicCode(value: unknown): string | undefined {
  if (!isRecord(value) || typeof value.code !== 'string') {
    return undefined;
  }

  return Object.hasOwn(publicMessages, value.code) ? value.code : undefined;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const requestId =
      (request as Partial<RequestWithId>).requestId ??
      resolveRequestId(request.get('x-request-id'));

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const code =
      readPublicCode(exceptionResponse) ??
      statusCodes[status] ??
      'INTERNAL_ERROR';
    const details = isRecord(exceptionResponse)
      ? readDetails(exceptionResponse.details)
      : undefined;
    const payload: ErrorResponse = {
      code,
      message: publicMessages[code] ?? publicMessages.INTERNAL_ERROR,
      requestId,
    };

    if (details) {
      payload.details = details;
    }

    response.status(status).json(payload);
  }
}
