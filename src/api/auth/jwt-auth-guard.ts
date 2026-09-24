import {
  HttpException,
  HttpStatus,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  AuthUserSessionRejectedError,
  AuthUserUnavailableError,
  type AuthUserSessionClient,
} from '../../application/ports/auth-user-session.js';
import {
  JwtExpiredError,
  JwtVerificationError,
  type JwtClaims,
  type JwtVerifier,
} from '../../application/ports/jwt-ports.js';

export interface AuthenticatedUser {
  readonly userId: string;
  readonly claims: JwtClaims;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtVerifier: JwtVerifier,
    private readonly authUserSessionClient: AuthUserSessionClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.get('authorization'));

    if (!token) {
      throw authenticationError('TOKEN_MISSING');
    }

    let claims: JwtClaims;
    try {
      claims = await this.jwtVerifier.verify(token);
    } catch (error) {
      if (error instanceof JwtExpiredError) {
        throw authenticationError('TOKEN_EXPIRED');
      }

      if (error instanceof JwtVerificationError) {
        throw authenticationError('TOKEN_INVALID');
      }

      throw authenticationError('TOKEN_INVALID');
    }

    try {
      const session = await this.authUserSessionClient.validate(token);

      if (session.userId !== claims.sub) {
        throw new AuthUserUnavailableError();
      }

      request.user = { userId: claims.sub, claims };
      return true;
    } catch (error) {
      if (error instanceof AuthUserSessionRejectedError) {
        throw authenticationError(error.code);
      }

      if (error instanceof AuthUserUnavailableError) {
        throw new HttpException(
          { code: 'AUTHUSER_UNAVAILABLE' },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        { code: 'AUTHUSER_UNAVAILABLE' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const match = /^Bearer ([^\s]+)$/iu.exec(authorization.trim());
  return match?.[1] ?? null;
}

function authenticationError(
  code: 'TOKEN_MISSING' | 'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'SESSION_REVOKED',
): HttpException {
  return new HttpException({ code }, HttpStatus.UNAUTHORIZED);
}
