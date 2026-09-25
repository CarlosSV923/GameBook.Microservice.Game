import { generateKeyPairSync } from 'node:crypto';
import { validateGameEnvironment } from '../../../../src/infrastructure/config/game-runtime-config.js';

function createEnvironment(): NodeJS.ProcessEnv {
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

  return {
    GAME_DATABASE_URL: 'postgresql://ep-develop.neon.tech/gamebook',
    JWT_PUBLIC_KEY: publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString()
      .replace(/\n/g, '\\n'),
    JWT_ISSUER: 'gamebook-authuser-development',
    JWT_AUDIENCE: 'gamebook-api-development',
    AUTHUSER_URL: 'http://localhost:3001',
  };
}

describe('validateGameEnvironment', () => {
  it('loads the development runtime contract without exposing values', () => {
    const configuration = validateGameEnvironment(createEnvironment());

    expect(configuration).toMatchObject({
      GAME_DATABASE_URL: 'postgresql://ep-develop.neon.tech/gamebook',
      JWT_ISSUER: 'gamebook-authuser-development',
      JWT_AUDIENCE: 'gamebook-api-development',
      AUTHUSER_URL: 'http://localhost:3001',
    });
    expect(configuration.JWT_PUBLIC_KEY).toContain('BEGIN PUBLIC KEY');
  });

  it('normalizes escaped PEM newlines', () => {
    const environment = createEnvironment();
    const configuration = validateGameEnvironment(environment);

    expect(configuration.JWT_PUBLIC_KEY).not.toContain('\\n');
    expect(configuration.JWT_PUBLIC_KEY).toContain('\n');
  });

  it('fails closed when required settings are missing', () => {
    const environment = createEnvironment();
    delete environment.JWT_PUBLIC_KEY;

    expect(() => validateGameEnvironment(environment)).toThrow(
      'Missing required Game configuration: JWT_PUBLIC_KEY',
    );
  });

  it('rejects invalid database URLs and public keys without revealing values', () => {
    const environment = createEnvironment();
    environment.GAME_DATABASE_URL = 'https://not-a-database.example';

    expect(() => validateGameEnvironment(environment)).toThrow(
      'Invalid Game configuration: GAME_DATABASE_URL',
    );

    environment.GAME_DATABASE_URL = 'postgresql://example.invalid/gamebook';
    environment.JWT_PUBLIC_KEY = 'not-a-public-key';

    let error: unknown;
    try {
      validateGameEnvironment(environment);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain('not-a-public-key');
  });
});
