# ---- Build Stage (aliased as 'build') ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
# This runs `prisma generate` as part of the install
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev


# ---- Runtime Stage (aliased as 'runtime') ----
FROM node:20-slim AS runtime
# Install openssl, which is a runtime dependency for Prisma
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production

# Copy the application files from the build stage
COPY --from=build /app .

# FINAL FIX: Explicitly copy the generated Prisma client to the runtime stage.
# This ensures the database engine is available in the final image.
COPY --from=build /app/node_modules/.prisma/client ./node_modules/.prisma/client

EXPOSE 8080
CMD ["npm", "run", "start:prod"]
