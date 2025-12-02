#!/bin/bash
# Generate thumbnails from live stream for preview
# Usage: generate-thumbnails.sh <stream_name> <app_name>

STREAM_NAME=$1
APP_NAME=$2
THUMB_PATH="/tmp/thumbnails"
INTERVAL=10  # Generate thumbnail every 10 seconds

mkdir -p "${THUMB_PATH}"

while true; do
    # Check if stream is still active
    if ! pgrep -f "ffmpeg.*${STREAM_NAME}" > /dev/null; then
        echo "Stream ${STREAM_NAME} ended, stopping thumbnail generation"
        break
    fi

    # Generate thumbnail from the stream
    ffmpeg -y -i "rtmp://127.0.0.1:1935/${APP_NAME}/${STREAM_NAME}" \
        -vframes 1 \
        -s 320x180 \
        -f image2 \
        "${THUMB_PATH}/${STREAM_NAME}.jpg" \
        2>/dev/null

    # Also generate a larger preview
    ffmpeg -y -i "rtmp://127.0.0.1:1935/${APP_NAME}/${STREAM_NAME}" \
        -vframes 1 \
        -s 640x360 \
        -f image2 \
        "${THUMB_PATH}/${STREAM_NAME}_preview.jpg" \
        2>/dev/null

    sleep ${INTERVAL}
done
