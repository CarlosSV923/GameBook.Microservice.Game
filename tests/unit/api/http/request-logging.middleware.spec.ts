import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestLoggingMiddleware } from '../../../../src/api/http/request-logging.middleware.js';

describe('RequestLoggingMiddleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs structured safe metadata and the authenticated user id', () => {
    const logger = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const response = Object.assign(new EventEmitter(), { statusCode: 200 });
    const request = {
      method: 'GET',
      path: '/v1/favorites',
      requestId: 'request-01',
      user: { userId: '123e4567-e89b-12d3-a456-426614174000' },
      headers: { authorization: 'Bearer secret-token' },
      body: { password: 'secret-password' },
    } as unknown as Request;

    new RequestLoggingMiddleware().use(
      request,
      response as unknown as Response,
      vi.fn() as NextFunction,
    );
    response.emit('finish');

    expect(logger).toHaveBeenCalledOnce();
    const record = JSON.parse(logger.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    expect(record).toMatchObject({
      level: 'info',
      message: 'HTTP request completed',
      requestId: 'request-01',
      operation: 'GET /v1/favorites',
      result: 'success',
      statusCode: 200,
      userId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(JSON.stringify(record)).not.toContain('secret-token');
    expect(JSON.stringify(record)).not.toContain('secret-password');
  });

  it('uses warn and error levels for failed responses', () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const request = {
      method: 'POST',
      path: '/v1/favorites',
      requestId: 'request-02',
    } as unknown as Request;

    for (const statusCode of [400, 503]) {
      const response = Object.assign(new EventEmitter(), { statusCode });
      new RequestLoggingMiddleware().use(
        request,
        response as unknown as Response,
        vi.fn() as NextFunction,
      );
      response.emit('finish');
    }

    expect(warn).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
  });
});
