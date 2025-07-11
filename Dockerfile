# ---- Build Stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
# REMOVED --ignore-scripts to allow prisma generate to run
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---- Runtime Stage ----
FROM node:20-slim AS runtime
# Install openssl, which is a runtime dependency for Prisma
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .

EXPOSE 8080
CMD ["npm", "run", "start:prod"]
