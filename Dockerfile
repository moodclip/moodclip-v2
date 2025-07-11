# ---- Build Stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---- Runtime Stage ----
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .

EXPOSE 8080
CMD ["npm", "run", "start:prod"]
