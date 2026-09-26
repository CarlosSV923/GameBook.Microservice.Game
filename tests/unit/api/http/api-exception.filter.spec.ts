import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExceptionFilter } from '../../../../src/api/http/api-exception.filter.js';

function createHost(requestId = 'request-from-client') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = {
    status,
  } as unknown as Response;
  const request = {
    get: vi.fn().mockReturnValue(requestId),
    requestId: undefined,
  } as unknown as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, response, json, status };
}

describe('ApiExceptionFilter', () => {
  it('returns stable validation errors with safe details', () => {
    const { host, json, status } = createHost();

    new ApiExceptionFilter().catch(
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'internal text must not escape',
        details: [
          { field: 'name', reason: 'INVALID_VALUE' },
          { field: 'password', reason: 'DO_NOT_LOG_THIS' },
          { field: 42, reason: 'ignored' },
        ],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      requestId: 'request-from-client',
      details: [
        { field: 'name', reason: 'INVALID_VALUE' },
        { field: 'password', reason: 'DO_NOT_LOG_THIS' },
      ],
    });
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
      'internal text',
    );
  });

  it('hides unexpected exception details', () => {
    const { host, json } = createHost();

    new ApiExceptionFilter().catch(
      new InternalServerErrorException({
        message: 'database password=not-public',
        stack: 'private stack',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      requestId: 'request-from-client',
    });
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('password');
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
      'private stack',
    );
  });
});
