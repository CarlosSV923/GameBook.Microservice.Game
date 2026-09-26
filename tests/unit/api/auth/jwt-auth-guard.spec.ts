import type { ExecutionContext } from '@nestjs/common';
import {
  AuthUserSessionRejectedError,
  AuthUserUnavailableError,
} from '../../../../src/application/ports/auth-user-session.js';
import {
  JwtExpiredError,
  JwtVerificationError,
  type JwtClaims,
} from '../../../../src/application/ports/jwt-ports.js';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../../../src/api/auth/jwt-auth-guard.js';

const claims: JwtClaims = {
  sub: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
  ver: 3,
  iat: 1_790_100_000,
  exp: 1_790_103_600,
  iss: 'authuser-local',
  aud: 'gamebook-local',
};

describe('JwtAuthGuard', () => {
  const verifier = { verify: vi.fn() };
  const sessionClient = { validate: vi.fn() };
  const guard = new JwtAuthGuard(verifier, sessionClient);

  beforeEach(() => vi.clearAllMocks());

  it('rejects a missing Bearer token with TOKEN_MISSING', async () => {
    const request = createRequest(undefined);

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      status: 401,
      response: { code: 'TOKEN_MISSING' },
    });
  });

  it('maps local invalid and expired tokens to the corresponding 401 codes', async () => {
    verifier.verify.mockRejectedValueOnce(new JwtVerificationError());
    await expect(
      guard.canActivate(createContext(createRequest('Bearer invalid'))),
    ).rejects.toMatchObject({ response: { code: 'TOKEN_INVALID' } });

    verifier.verify.mockRejectedValueOnce(new JwtExpiredError());
    await expect(
      guard.canActivate(createContext(createRequest('Bearer expired'))),
    ).rejects.toMatchObject({ response: { code: 'TOKEN_EXPIRED' } });
  });

  it('requires AuthUser confirmation before exposing the validated subject', async () => {
    verifier.verify.mockResolvedValue(claims);
    sessionClient.validate.mockResolvedValue({ userId: claims.sub });
    const request = createRequest('Bearer valid-token');

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(sessionClient.validate).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual({ userId: claims.sub, claims });
  });

  it('preserves upstream 401 codes and maps dependency failures to 503', async () => {
    verifier.verify.mockResolvedValue(claims);
    sessionClient.validate.mockRejectedValueOnce(
      new AuthUserSessionRejectedError('SESSION_REVOKED'),
    );
    await expect(
      guard.canActivate(createContext(createRequest('Bearer revoked'))),
    ).rejects.toMatchObject({
      status: 401,
      response: { code: 'SESSION_REVOKED' },
    });

    sessionClient.validate.mockRejectedValueOnce(
      new AuthUserUnavailableError(),
    );
    await expect(
      guard.canActivate(createContext(createRequest('Bearer unavailable'))),
    ).rejects.toMatchObject({
      status: 503,
      response: { code: 'AUTHUSER_UNAVAILABLE' },
    });
  });

  it('fails closed if AuthUser confirms a different subject', async () => {
    verifier.verify.mockResolvedValue(claims);
    sessionClient.validate.mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    });

    await expect(
      guard.canActivate(createContext(createRequest('Bearer mismatched'))),
    ).rejects.toMatchObject({
      status: 503,
      response: { code: 'AUTHUSER_UNAVAILABLE' },
    });
  });
});

function createRequest(
  authorization: string | undefined,
): AuthenticatedRequest {
  return {
    get: vi.fn().mockReturnValue(authorization),
  } as unknown as AuthenticatedRequest;
}

function createContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}
