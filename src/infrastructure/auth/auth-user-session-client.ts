import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  AuthUserSessionRejectedError,
  AuthUserUnavailableError,
  type AuthUserSession,
  type AuthUserSessionClient as AuthUserSessionClientPort,
  type AuthUserSessionErrorCode,
} from '../../application/ports/auth-user-session.js';

const DEFAULT_TIMEOUT_MS = 3_000;
const SESSION_PATH = '/v1/auth/session';
const SESSION_ERROR_CODES = new Set<AuthUserSessionErrorCode>([
  'TOKEN_MISSING',
  'TOKEN_INVALID',
  'TOKEN_EXPIRED',
  'SESSION_REVOKED',
]);

export class AuthUserSessionClient implements AuthUserSessionClientPort {
  private readonly sessionUrl: URL;

  constructor(
    authUserUrl: string,
    private readonly httpService: HttpService,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {
    this.sessionUrl = new URL(SESSION_PATH, ensureTrailingSlash(authUserUrl));
  }

  async validate(token: string): Promise<AuthUserSession> {
    let response: { status: number; data: unknown };
    try {
      response = await firstValueFrom(
        this.httpService.get(this.sessionUrl.toString(), {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: this.timeoutMs,
          validateStatus: () => true,
        }),
      );
    } catch {
      throw new AuthUserUnavailableError();
    }

    if (response.status === 401) {
      throw new AuthUserSessionRejectedError(
        readSessionErrorCode(response.data),
      );
    }

    if (response.status < 200 || response.status >= 300) {
      throw new AuthUserUnavailableError();
    }

    const userId = readSessionUserId(response.data);
    if (!userId) {
      throw new AuthUserUnavailableError();
    }

    return { userId };
  }
}

function readSessionErrorCode(body: unknown): AuthUserSessionErrorCode {
  if (
    isRecord(body) &&
    typeof body.code === 'string' &&
    SESSION_ERROR_CODES.has(body.code as AuthUserSessionErrorCode)
  ) {
    return body.code as AuthUserSessionErrorCode;
  }

  return 'TOKEN_INVALID';
}

function readSessionUserId(body: unknown): string | null {
  const user = isRecord(body) ? body.user : undefined;
  const userId = isRecord(user) ? user.id : undefined;
  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
