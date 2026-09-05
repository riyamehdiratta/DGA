# Builds and runs the backend API only. Deploy this on a free-tier host
# that supports Docker (e.g. Render) when the frontend is hosted separately
# (e.g. Vercel) - see the root README for the split-hosting plan. Build
# context is this backend/ directory, not the repo root.

# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# postgresql16-client provides pg_dump, used by the Admin Panel's backup
# feature (must match the Postgres server's major version).
RUN apk add --no-cache postgresql16-client
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
# scripts/create-user.ts (bootstrapping the first Admin account) runs via
# tsx against the TS source, not the compiled dist/ output - same as
# prisma/seed.ts. Both source directories are copied in so it works
# identically in the container as it does locally.
COPY scripts ./scripts
COPY src ./src

EXPOSE 3001

# Apply any pending migrations, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
