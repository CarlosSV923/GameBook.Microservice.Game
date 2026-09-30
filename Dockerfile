FROM node:24-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
RUN pnpm build

RUN chown -R node:node /app
USER node

EXPOSE 3002
CMD ["pnpm", "start:prod"]
