import { createPublicKey } from 'node:crypto';

export function validateGameEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const databaseUrl = required(environment, 'GAME_DATABASE_URL');
  validateDatabaseUrl(databaseUrl);

  const jwtPublicKey = normalizePem(required(environment, 'JWT_PUBLIC_KEY'));
  createPublicKey(jwtPublicKey);

  const authUserUrl = required(environment, 'AUTHUSER_URL');
  validateHttpUrl(authUserUrl, 'AUTHUSER_URL');

  return {
    ...environment,
    GAME_DATABASE_URL: databaseUrl,
    JWT_PUBLIC_KEY: jwtPublicKey,
    JWT_ISSUER: required(environment, 'JWT_ISSUER'),
    JWT_AUDIENCE: required(environment, 'JWT_AUDIENCE'),
    AUTHUSER_URL: authUserUrl,
  };
}

function required(environment: Record<string, unknown>, name: string): string {
  const value = environment[name];

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required Game configuration: ${name}`);
  }

  return value.trim();
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
