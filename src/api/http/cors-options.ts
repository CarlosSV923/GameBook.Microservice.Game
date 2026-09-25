type CorsCallback = (error: Error | null, allowed?: boolean) => void;

export function getAllowedCorsOrigins(
  environment: NodeJS.ProcessEnv = process.env,
): string[] {
  return (environment.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== '*');
}

export function createCorsOptions(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const allowedOrigins = new Set(getAllowedCorsOrigins(environment));

  return {
    origin: (requestOrigin: string | undefined, callback: CorsCallback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.has(requestOrigin));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: false,
  };
}
