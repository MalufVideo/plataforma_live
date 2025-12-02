#!/bin/bash
# Cleanup old HLS segments and recordings
# Run via cron: 0 * * * * /scripts/cleanup.sh

HLS_PATH="/tmp/hls"
RECORDINGS_PATH="/tmp/recordings"
THUMBNAILS_PATH="/tmp/thumbnails"

# Max age in minutes
HLS_MAX_AGE=60
RECORDINGS_MAX_AGE=10080  # 7 days
THUMBNAILS_MAX_AGE=1440   # 1 day

echo "[$(date)] Starting cleanup..."

# Cleanup old HLS segments (older than 1 hour)
if [ -d "$HLS_PATH" ]; then
    find "$HLS_PATH" -type f \( -name "*.ts" -o -name "*.m3u8" \) -mmin +$HLS_MAX_AGE -delete
    find "$HLS_PATH" -type d -empty -delete
    echo "[$(date)] HLS cleanup complete"
fi

# Cleanup old recordings (older than 7 days)
if [ -d "$RECORDINGS_PATH" ]; then
    find "$RECORDINGS_PATH" -type f -mmin +$RECORDINGS_MAX_AGE -delete
    echo "[$(date)] Recordings cleanup complete"
fi

# Cleanup old thumbnails (older than 1 day)
if [ -d "$THUMBNAILS_PATH" ]; then
    find "$THUMBNAILS_PATH" -type f -mmin +$THUMBNAILS_MAX_AGE -delete
    echo "[$(date)] Thumbnails cleanup complete"
fi

echo "[$(date)] Cleanup finished"
