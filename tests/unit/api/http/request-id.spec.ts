import type { Request, Response } from 'express';
import {
  REQUEST_ID_HEADER,
  RequestIdMiddleware,
  createRequestId,
  resolveRequestId,
} from '../../../../src/api/http/request-id.js';

describe('request id', () => {
  it('preserves a safe incoming request id', () => {
    expect(resolveRequestId('frontend-request-01')).toBe('frontend-request-01');
  });

  it('replaces an invalid request id with a generated one', () => {
    const requestId = resolveRequestId('contains spaces');

    expect(requestId).toMatch(/^req_[0-9a-f-]{36}$/);
  });

  it('generates request ids with a stable prefix', () => {
    expect(createRequestId()).toMatch(/^req_[0-9a-f-]{36}$/);
  });

  it('stores and returns the resolved id at the HTTP boundary', () => {
    const request = {
      get: vi.fn().mockReturnValue('client-request-01'),
    } as unknown as Request;
    const response = {
      setHeader: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    new RequestIdMiddleware().use(request, response, next);

    expect((request as Request & { requestId: string }).requestId).toBe(
      'client-request-01',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'client-request-01',
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
