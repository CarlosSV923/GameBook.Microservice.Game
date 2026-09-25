export interface JwtClaims {
  readonly sub: string;
  readonly ver: number;
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
}

export const JWT_VERIFIER = Symbol('JWT_VERIFIER');

export interface JwtVerifier {
  verify(token: string): Promise<JwtClaims>;
}

export class JwtVerificationError extends Error {
  constructor() {
    super('JWT verification failed.');
    this.name = 'JwtVerificationError';
  }
}

export class JwtExpiredError extends JwtVerificationError {
  constructor() {
    super();
    this.name = 'JwtExpiredError';
  }
}
