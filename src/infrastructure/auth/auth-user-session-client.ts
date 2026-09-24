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

export type Fetcher = typeof fetch;

export class AuthUserSessionClient implements AuthUserSessionClientPort {
  private readonly sessionUrl: URL;

  constructor(
    authUserUrl: string,
    private readonly fetcher: Fetcher = fetch,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {
    this.sessionUrl = new URL(SESSION_PATH, ensureTrailingSlash(authUserUrl));
  }

  async validate(token: string): Promise<AuthUserSession> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetcher(this.sessionUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
    } catch {
      throw new AuthUserUnavailableError();
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 401) {
      throw new AuthUserSessionRejectedError(
        await readSessionErrorCode(response),
      );
    }

    if (!response.ok) {
      throw new AuthUserUnavailableError();
    }

    const userId = await readSessionUserId(response);
    if (!userId) {
      throw new AuthUserUnavailableError();
    }

    return { userId };
  }
}

async function readSessionErrorCode(
  response: Response,
): Promise<AuthUserSessionErrorCode> {
  try {
    const body: unknown = await response.json();
    if (
      isRecord(body) &&
      typeof body.code === 'string' &&
      SESSION_ERROR_CODES.has(body.code as AuthUserSessionErrorCode)
    ) {
      return body.code as AuthUserSessionErrorCode;
    }
  } catch {
    // The stable fallback below keeps the error response generic.
  }

  return 'TOKEN_INVALID';
}

async function readSessionUserId(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    const user = isRecord(body) ? body.user : undefined;
    const userId = isRecord(user) ? user.id : undefined;
    return typeof userId === 'string' && userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
