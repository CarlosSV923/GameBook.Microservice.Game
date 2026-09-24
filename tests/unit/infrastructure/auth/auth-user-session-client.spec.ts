import type { AuthUserSessionErrorCode } from '../../../../src/application/ports/auth-user-session.js';
import {
  AuthUserSessionRejectedError,
  AuthUserUnavailableError,
} from '../../../../src/application/ports/auth-user-session.js';
import {
  AuthUserSessionClient,
  type Fetcher,
} from '../../../../src/infrastructure/auth/auth-user-session-client.js';

describe('AuthUserSessionClient', () => {
  it('forwards the exact Bearer token and reads the authenticated user', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ user: { id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa' } }),
      ) as unknown as Fetcher;
    const client = new AuthUserSessionClient('http://authuser.test', fetcher);

    await expect(client.validate('header.payload.signature')).resolves.toEqual({
      userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    });
    expect(fetcher).toHaveBeenCalledWith(
      new URL('http://authuser.test/v1/auth/session'),
      expect.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
      }),
    );
  });

  it.each<AuthUserSessionErrorCode>([
    'TOKEN_INVALID',
    'TOKEN_EXPIRED',
    'SESSION_REVOKED',
  ])('preserves the stable AuthUser 401 code: %s', async (code) => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ code }, 401)) as unknown as Fetcher;
    const client = new AuthUserSessionClient('http://authuser.test', fetcher);

    await expect(client.validate('token')).rejects.toEqual(
      new AuthUserSessionRejectedError(code),
    );
  });

  it('fails closed for network errors, timeouts, non-401 errors, and malformed success responses', async () => {
    const networkFetcher = vi
      .fn()
      .mockRejectedValue(new Error('offline')) as unknown as Fetcher;
    const networkClient = new AuthUserSessionClient(
      'http://authuser.test',
      networkFetcher,
    );
    await expect(networkClient.validate('token')).rejects.toBeInstanceOf(
      AuthUserUnavailableError,
    );

    const serverFetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 503 }),
      ) as unknown as Fetcher;
    const serverClient = new AuthUserSessionClient(
      'http://authuser.test',
      serverFetcher,
    );
    await expect(serverClient.validate('token')).rejects.toBeInstanceOf(
      AuthUserUnavailableError,
    );

    const malformedFetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({})) as unknown as Fetcher;
    const malformedClient = new AuthUserSessionClient(
      'http://authuser.test',
      malformedFetcher,
    );
    await expect(malformedClient.validate('token')).rejects.toBeInstanceOf(
      AuthUserUnavailableError,
    );
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
