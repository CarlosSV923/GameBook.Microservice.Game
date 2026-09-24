import { createPublicKey } from 'node:crypto';

export const GAME_RUNTIME_CONFIG = Symbol('GAME_RUNTIME_CONFIG');

export interface GameRuntimeConfig {
  readonly databaseUrl: string;
  readonly jwtPublicKey: string;
  readonly jwtIssuer: string;
  readonly jwtAudience: string;
  readonly authUserUrl: string;
}

export function loadGameRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): GameRuntimeConfig {
  const databaseUrl = required(environment, 'GAME_DATABASE_URL');
  validateDatabaseUrl(databaseUrl);

  const jwtPublicKey = normalizePem(required(environment, 'JWT_PUBLIC_KEY'));
  createPublicKey(jwtPublicKey);

  const authUserUrl = required(environment, 'AUTHUSER_URL');
  validateHttpUrl(authUserUrl, 'AUTHUSER_URL');

  return {
    databaseUrl,
    jwtPublicKey,
    jwtIssuer: required(environment, 'JWT_ISSUER'),
    jwtAudience: required(environment, 'JWT_AUDIENCE'),
    authUserUrl,
  };
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing required Game configuration: ${name}`);
  }

  return value;
}

function normalizePem(value: string): string {
  return value.replace(/\\n/g, '\n').trim();
}

function validateDatabaseUrl(value: string): void {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('Invalid Game configuration: GAME_DATABASE_URL');
  }

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('Invalid Game configuration: GAME_DATABASE_URL');
  }
}

function validateHttpUrl(value: string, name: string): void {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid Game configuration: ${name}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Invalid Game configuration: ${name}`);
  }
}
