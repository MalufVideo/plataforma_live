#!/bin/bash
# Transcode incoming RTMP stream to multiple bitrates for adaptive streaming
# Usage: transcode.sh <stream_name> <app_name>

STREAM_NAME=$1
APP_NAME=$2

# Output directory
HLS_PATH="/tmp/hls/${STREAM_NAME}"
THUMB_PATH="/tmp/thumbnails"

# Create directories
mkdir -p "${HLS_PATH}"
mkdir -p "${THUMB_PATH}"

# Log file
LOG_FILE="/var/log/nginx/transcode_${STREAM_NAME}.log"

echo "[$(date)] Starting transcode for stream: ${STREAM_NAME}" >> "${LOG_FILE}"

# FFmpeg transcoding to multiple bitrates
# Input: RTMP stream from nginx
# Output: HLS with multiple quality variants

ffmpeg -i "rtmp://127.0.0.1:1935/${APP_NAME}/${STREAM_NAME}" \
    -filter_complex "[0:v]split=4[v1][v2][v3][v4]; \
        [v1]scale=1920:1080[v1out]; \
        [v2]scale=1280:720[v2out]; \
        [v3]scale=854:480[v3out]; \
        [v4]scale=640:360[v4out]" \
    -map "[v1out]" -map 0:a -c:v:0 libx264 -preset veryfast -tune zerolatency \
        -b:v:0 5000k -maxrate:v:0 5500k -bufsize:v:0 10000k \
        -c:a:0 aac -b:a:0 192k -ar 48000 \
        -g 48 -keyint_min 48 -sc_threshold 0 \
        -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments+append_list \
        -hls_segment_filename "${HLS_PATH}/1080p_%03d.ts" \
        "${HLS_PATH}/1080p.m3u8" \
    -map "[v2out]" -map 0:a -c:v:1 libx264 -preset veryfast -tune zerolatency \
        -b:v:1 2500k -maxrate:v:1 2750k -bufsize:v:1 5000k \
        -c:a:1 aac -b:a:1 128k -ar 48000 \
        -g 48 -keyint_min 48 -sc_threshold 0 \
        -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments+append_list \
        -hls_segment_filename "${HLS_PATH}/720p_%03d.ts" \
        "${HLS_PATH}/720p.m3u8" \
    -map "[v3out]" -map 0:a -c:v:2 libx264 -preset veryfast -tune zerolatency \
        -b:v:2 1000k -maxrate:v:2 1100k -bufsize:v:2 2000k \
        -c:a:2 aac -b:a:2 96k -ar 44100 \
        -g 48 -keyint_min 48 -sc_threshold 0 \
        -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments+append_list \
        -hls_segment_filename "${HLS_PATH}/480p_%03d.ts" \
        "${HLS_PATH}/480p.m3u8" \
    -map "[v4out]" -map 0:a -c:v:3 libx264 -preset veryfast -tune zerolatency \
        -b:v:3 500k -maxrate:v:3 550k -bufsize:v:3 1000k \
        -c:a:3 aac -b:a:3 64k -ar 44100 \
        -g 48 -keyint_min 48 -sc_threshold 0 \
        -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments+append_list \
        -hls_segment_filename "${HLS_PATH}/360p_%03d.ts" \
        "${HLS_PATH}/360p.m3u8" \
    2>> "${LOG_FILE}" &

FFMPEG_PID=$!
echo "[$(date)] FFmpeg started with PID: ${FFMPEG_PID}" >> "${LOG_FILE}"

# Generate master playlist
cat > "${HLS_PATH}/master.m3u8" << EOF
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5192000,RESOLUTION=1920x1080,NAME="1080p"
1080p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720,NAME="720p"
720p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1096000,RESOLUTION=854x480,NAME="480p"
480p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=564000,RESOLUTION=640x360,NAME="360p"
360p.m3u8
EOF

echo "[$(date)] Master playlist created" >> "${LOG_FILE}"

# Start thumbnail generation in background
/scripts/generate-thumbnails.sh "${STREAM_NAME}" "${APP_NAME}" &

# Wait for FFmpeg to finish (when stream ends)
wait ${FFMPEG_PID}
EXIT_CODE=$?

echo "[$(date)] Transcode finished with exit code: ${EXIT_CODE}" >> "${LOG_FILE}"

# Cleanup on stream end
if [ ${EXIT_CODE} -eq 0 ]; then
    echo "[$(date)] Stream ended normally, keeping files for VOD" >> "${LOG_FILE}"
else
    echo "[$(date)] Stream ended with error" >> "${LOG_FILE}"
fi
