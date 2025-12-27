FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app

# Install ffmpeg for media transcoding
RUN apk add --no-cache ffmpeg

COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

# Expose ports:
# 3000 - API server
# 1936 - RTMP ingestion
# 8001 - HTTP-FLV / WebSocket / HLS playback
EXPOSE 3000 1936 8001

CMD ["node", "src/index.js"]
