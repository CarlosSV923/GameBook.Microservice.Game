import {
  createPrivateKey,
  createSign,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';
import {
  JwtExpiredError,
  JwtVerificationError,
} from '../../../../src/application/ports/jwt-ports.js';
import { RsaJwtVerifier } from '../../../../src/infrastructure/cryptography/rsa-jwt.js';

const claims = {
  sub: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
  ver: 3,
  iat: 1_790_100_000,
  exp: 1_790_103_600,
  iss: 'authuser-local',
  aud: 'gamebook-local',
} as const;

describe('RsaJwtVerifier', () => {
  const keyPair = createKeyPair();

  it('verifies RS256 tokens with the contract claims', async () => {
    const verifier = new RsaJwtVerifier(
      keyPair.publicKey,
      claims.iss,
      claims.aud,
      () => 1_790_100_001,
    );

    await expect(
      verifier.verify(signToken(keyPair.privateKey, claims)),
    ).resolves.toEqual(claims);
  });

  it('rejects a manipulated signature, algorithm, or identity claim', async () => {
    const verifier = new RsaJwtVerifier(
      keyPair.publicKey,
      claims.iss,
      claims.aud,
      () => 1_790_100_001,
    );
    const token = signToken(keyPair.privateKey, claims);
    const [header, payload, signature] = token.split('.');
    const invalidAlgorithm = signToken(keyPair.privateKey, claims, {
      alg: 'HS256',
      typ: 'JWT',
    });
    const invalidSubject = signToken(keyPair.privateKey, {
      ...claims,
      sub: 'not-a-uuid',
    });

    await expect(
      verifier.verify(`${header}.${payload}.${signature}x`),
    ).rejects.toBeInstanceOf(JwtVerificationError);
    await expect(verifier.verify(invalidAlgorithm)).rejects.toBeInstanceOf(
      JwtVerificationError,
    );
    await expect(verifier.verify(invalidSubject)).rejects.toBeInstanceOf(
      JwtVerificationError,
    );
  });

  it('distinguishes an expired token at the contract boundary', async () => {
    const verifier = new RsaJwtVerifier(
      keyPair.publicKey,
      claims.iss,
      claims.aud,
      () => claims.exp,
    );

    await expect(
      verifier.verify(signToken(keyPair.privateKey, claims)),
    ).rejects.toBeInstanceOf(JwtExpiredError);
  });
});

function createKeyPair(): { privateKey: KeyObject; publicKey: string } {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  return { privateKey: createPrivateKeyObject(privateKey), publicKey };
}

function createPrivateKeyObject(privateKey: string): KeyObject {
  return createPrivateKey(privateKey);
}

function signToken(
  privateKey: KeyObject,
  payload: object,
  header: object = { alg: 'RS256', typ: 'JWT' },
): string {
  const encodedHeader = encodeJson(header);
  const encodedPayload = encodeJson(payload);
  const input = `${encodedHeader}.${encodedPayload}`;
  const signature = createSign('RSA-SHA256')
    .update(input)
    .end()
    .sign(privateKey)
    .toString('base64url');

  return `${input}.${signature}`;
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
