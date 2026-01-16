
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time (Satisfy Next.js compiler)
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL postgresql://dummy:dummy@localhost:5432/dummy
ENV NEXTAUTH_SECRET build_dummy_secret
ENV NEXTAUTH_URL http://localhost:4000
ENV XAI_API_KEY build_dummy_xai
ENV OPENAI_API_KEY build_dummy_openai

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 4000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy WASM files needed at runtime (tiny-secp256k1 for Bitcoin addresses)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tiny-secp256k1/lib/secp256k1.wasm ./node_modules/tiny-secp256k1/lib/secp256k1.wasm

# Include migration tools and scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db/schema.ts ./src/lib/db/schema.ts

# Install tools globally for remote execution
RUN npm install -g drizzle-kit tsx dotenv-cli

USER nextjs

EXPOSE 4000

CMD ["node", "server.js"]
