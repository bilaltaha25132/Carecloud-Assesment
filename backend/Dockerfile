FROM node:20-slim

# Prisma's migration engine needs libssl at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all dependencies (dev included) so the build, migrations and seed can run.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Prisma's config resolves DATABASE_URL even for `generate`; a throwaway value
# satisfies it at build time. The real URL is injected at runtime by Compose.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Apply migrations and open the standard clinic slots, then start the API.
# The seed is idempotent, so a restart is safe.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && node dist/main.js"]
