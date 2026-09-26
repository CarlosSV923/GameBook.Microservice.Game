import {
  createCorsOptions,
  getAllowedCorsOrigins,
} from '../../../../src/api/http/cors-options.js';

describe('CORS options', () => {
  it('parses explicit origins and ignores wildcard values', () => {
    expect(
      getAllowedCorsOrigins({
        CORS_ALLOWED_ORIGINS:
          ' http://localhost:3000, https://portfolio.test, * ',
      }),
    ).toEqual(['http://localhost:3000', 'https://portfolio.test']);
  });

  it('allows only exact configured origins', () => {
    const options = createCorsOptions({
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    });
    const callback = vi.fn();

    options.origin('http://localhost:3000', callback);
    expect(callback).toHaveBeenCalledWith(null, true);

    options.origin('http://localhost:3001', callback);
    expect(callback).toHaveBeenLastCalledWith(null, false);
  });

  it('allows non-browser requests without opening cross-origin access', () => {
    const options = createCorsOptions({});
    const callback = vi.fn();

    options.origin(undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
    expect(options.credentials).toBe(false);
    expect(options.exposedHeaders).toContain('X-Request-Id');
  });
});
