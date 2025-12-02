#!/bin/bash
# Health check script for the streaming container

# Check Nginx
if ! pgrep -x "nginx" > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check Node.js API
if ! curl -sf http://localhost:3000/health > /dev/null; then
    echo "API is not responding"
    exit 1
fi

# Check RTMP port
if ! nc -z localhost 1935; then
    echo "RTMP port is not open"
    exit 1
fi

echo "All services healthy"
exit 0
