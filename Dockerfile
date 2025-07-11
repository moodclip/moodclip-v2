# ---- Build Stage ----
  FROM node:20-slim AS build
  WORKDIR /app

  COPY package*.json ./
  # This installs dependencies and runs `prisma generate` for the first time
  RUN npm ci

  COPY . .
  RUN npm run build

  # FINAL FIX: Generate Prisma client before pruning dev dependencies
  # This prevents `npm prune` from deleting the necessary engine files.
  RUN npx prisma generate
  RUN npm prune --omit=dev

  # ---- Runtime Stage ----
  FROM node:20-slim AS runtime
  # Install openssl, a runtime dependency for Prisma
  RUN apt-get update && apt-get install -y openssl

  WORKDIR /app
  ENV NODE_ENV=production
  # Copy the entire pruned and regenerated application from the build stage
  COPY --from=build /app .

  EXPOSE 8080
  CMD ["npm", "run", "start:prod"]
