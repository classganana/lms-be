FROM node:20-alpine AS base

WORKDIR /usr/src/app

# Common OS dependencies (kept minimal)
RUN apk add --no-cache curl

FROM base AS builder

# Build-time dependencies for native modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

# Install all dependencies using lockfile to ensure reproducible builds
COPY package.json package-lock.json* ./
# Use legacy-peer-deps to avoid peer dependency resolution / merge conflicts during image builds
RUN npm ci --legacy-peer-deps

# Copy sources and build
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

# Optional build-time envs (can be overridden at runtime)
ARG MONGODB_URI
ARG PORT=3000
ENV MONGODB_URI=${MONGODB_URI}
ENV PORT=${PORT}

# Create non-root user for running the app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what is needed to run the app
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Ensure permissions for non-root user
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
