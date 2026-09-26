import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import type { AuthUserSessionErrorCode } from '../../../../src/application/ports/auth-user-session.js';
import {
  AuthUserSessionRejectedError,
  AuthUserUnavailableError,
} from '../../../../src/application/ports/auth-user-session.js';
import { AuthUserSessionClient } from '../../../../src/infrastructure/auth/auth-user-session-client.js';

describe('AuthUserSessionClient', () => {
  it('forwards the exact Bearer token and reads the authenticated user', async () => {
    const httpService = createHttpService();
    httpService.get.mockReturnValue(
      of({
        status: 200,
        data: { user: { id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa' } },
      }),
    );
    const client = new AuthUserSessionClient(
      'http://authuser.test',
      httpService,
    );

    await expect(client.validate('header.payload.signature')).resolves.toEqual({
      userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    });
    expect(httpService.get).toHaveBeenCalledWith(
      'http://authuser.test/v1/auth/session',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        timeout: 3_000,
        validateStatus: expect.any(Function),
      }),
    );
  });

  it.each<AuthUserSessionErrorCode>([
    'TOKEN_INVALID',
    'TOKEN_EXPIRED',
    'SESSION_REVOKED',
  ])('preserves the stable AuthUser 401 code: %s', async (code) => {
    const httpService = createHttpService();
    httpService.get.mockReturnValue(of({ status: 401, data: { code } }));
    const client = new AuthUserSessionClient(
      'http://authuser.test',
      httpService,
    );

    await expect(client.validate('token')).rejects.toEqual(
      new AuthUserSessionRejectedError(code),
    );
  });

  it('fails closed for network errors, timeouts, non-401 errors, and malformed success responses', async () => {
    const networkFetcher = createHttpService();
    networkFetcher.get.mockReturnValue(throwError(() => new Error('offline')));
    const networkClient = new AuthUserSessionClient(
      'http://authuser.test',
      networkFetcher,
    );
    await expect(networkClient.validate('token')).rejects.toBeInstanceOf(
      AuthUserUnavailableError,
    );

    const serverFetcher = createHttpService();
    serverFetcher.get.mockReturnValue(of({ status: 503, data: undefined }));
    const serverClient = new AuthUserSessionClient(
      'http://authuser.test',
      serverFetcher,
    );
    await expect(serverClient.validate('token')).rejects.toBeInstanceOf(
      AuthUserUnavailableError,
    );

    const malformedFetcher = createHttpService();
    malformedFetcher.get.mockReturnValue(of({ status: 200, data: {} }));
    const malformedClient = new AuthUserSessionClient(
      'http://authuser.test',
      malformedFetcher,
    );
    await expect(malformedClient.validate('token')).rejects.toBeInstanceOf(
      AuthUserUnavailableError,
    );
  });
});

function createHttpService(): HttpService & { get: ReturnType<typeof vi.fn> } {
  return {
    get: vi.fn(),
  } as unknown as HttpService & { get: ReturnType<typeof vi.fn> };
}
