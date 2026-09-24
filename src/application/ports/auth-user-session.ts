export interface AuthUserSession {
  readonly userId: string;
}

export interface AuthUserSessionClient {
  validate(token: string): Promise<AuthUserSession>;
}

export type AuthUserSessionErrorCode =
  'TOKEN_MISSING' | 'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'SESSION_REVOKED';

export class AuthUserSessionRejectedError extends Error {
  constructor(readonly code: AuthUserSessionErrorCode) {
    super('AuthUser rejected the session.');
    this.name = 'AuthUserSessionRejectedError';
  }
}

export class AuthUserUnavailableError extends Error {
  constructor() {
    super('AuthUser session validation is unavailable.');
    this.name = 'AuthUserUnavailableError';
  }
}
