FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm install -g pnpm && pnpm build

# Production image, copy all the files and run nginx
FROM nginx:mainline-alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/. /etc/nginx/templates/.
RUN rm /etc/nginx/conf.d/*

# Copy build output from Next.js
COPY --from=builder /app/dist /usr/share/nginx/html

ENV PORT 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"] 