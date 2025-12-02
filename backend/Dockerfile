# Multi-stage build for Live Video Streaming Platform
# Nginx RTMP + FFmpeg + Node.js API

FROM ubuntu:22.04 AS builder

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpcre3 \
    libpcre3-dev \
    libssl-dev \
    zlib1g-dev \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Download and compile Nginx with RTMP module
WORKDIR /tmp
RUN wget http://nginx.org/download/nginx-1.24.0.tar.gz && \
    tar -xzf nginx-1.24.0.tar.gz && \
    git clone https://github.com/arut/nginx-rtmp-module.git

WORKDIR /tmp/nginx-1.24.0
RUN ./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib64/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_realip_module \
    --with-http_stub_status_module \
    --with-http_auth_request_module \
    --with-threads \
    --with-stream \
    --with-stream_ssl_module \
    --add-module=/tmp/nginx-rtmp-module && \
    make && make install

# Final stage
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpcre3 \
    libssl3 \
    zlib1g \
    ffmpeg \
    curl \
    supervisor \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Nginx from builder
COPY --from=builder /usr/sbin/nginx /usr/sbin/nginx
COPY --from=builder /etc/nginx /etc/nginx

# Create necessary directories
RUN mkdir -p /var/log/nginx \
    /var/run \
    /var/cache/nginx \
    /tmp/hls \
    /tmp/dash \
    /tmp/recordings \
    /app

# Copy Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/rtmp.conf /etc/nginx/rtmp.conf

# Copy API application
WORKDIR /app
COPY api/package*.json ./
RUN npm ci --only=production
COPY api/ ./

# Copy transcoding scripts
COPY scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Copy supervisor configuration
COPY supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
# 1935 - RTMP ingest
# 8080 - HTTP/HLS/DASH streaming
# 3000 - API
EXPOSE 1935 8080 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start services via supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
