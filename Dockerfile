FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable

# Approve build scripts para better-auth y prisma
RUN pnpm approve-builds @prisma/client @prisma/engines better-sqlite3 esbuild prisma

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/server.js"]
