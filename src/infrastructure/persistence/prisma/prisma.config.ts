import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schema.prisma',
  migrations: {
    path: 'migrations',
  },
  datasource: {
    url: process.env.GAME_DATABASE_DIRECT_URL ?? process.env.GAME_DATABASE_URL,
  },
});
