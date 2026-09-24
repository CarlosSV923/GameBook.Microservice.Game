import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export type RequestWithId = Request & {
  requestId: string;
};

export function createRequestId(): string {
  return `req_${randomUUID()}`;
}

export function resolveRequestId(candidate: string | undefined): string {
  if (candidate && requestIdPattern.test(candidate)) {
    return candidate;
  }

  return createRequestId();
}

export class RequestIdMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.get(REQUEST_ID_HEADER));
    (request as RequestWithId).requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
