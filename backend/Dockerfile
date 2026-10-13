FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY backend ./backend

# Install dependencies and build
RUN npm install
RUN npm run build --workspace=@dispatch/shared
RUN npm run build --workspace=backend

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main.js"]
