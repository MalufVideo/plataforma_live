#!/bin/bash
# Simplified single-output transcode for lower CPU usage
# Usage: transcode-simple.sh <stream_name> <app_name> <quality>

STREAM_NAME=$1
APP_NAME=$2
QUALITY=${3:-720p}

HLS_PATH="/tmp/hls/${STREAM_NAME}"
mkdir -p "${HLS_PATH}"

case ${QUALITY} in
    "1080p")
        RESOLUTION="1920x1080"
        VIDEO_BITRATE="5000k"
        AUDIO_BITRATE="192k"
        ;;
    "720p")
        RESOLUTION="1280x720"
        VIDEO_BITRATE="2500k"
        AUDIO_BITRATE="128k"
        ;;
    "480p")
        RESOLUTION="854x480"
        VIDEO_BITRATE="1000k"
        AUDIO_BITRATE="96k"
        ;;
    "360p")
        RESOLUTION="640x360"
        VIDEO_BITRATE="500k"
        AUDIO_BITRATE="64k"
        ;;
    *)
        RESOLUTION="1280x720"
        VIDEO_BITRATE="2500k"
        AUDIO_BITRATE="128k"
        ;;
esac

ffmpeg -i "rtmp://127.0.0.1:1935/${APP_NAME}/${STREAM_NAME}" \
    -c:v libx264 -preset veryfast -tune zerolatency \
    -s ${RESOLUTION} \
    -b:v ${VIDEO_BITRATE} -maxrate ${VIDEO_BITRATE} -bufsize $((${VIDEO_BITRATE%k} * 2))k \
    -c:a aac -b:a ${AUDIO_BITRATE} -ar 48000 \
    -g 48 -keyint_min 48 -sc_threshold 0 \
    -f hls \
    -hls_time 2 \
    -hls_list_size 5 \
    -hls_flags delete_segments+append_list \
    -hls_segment_filename "${HLS_PATH}/${QUALITY}_%03d.ts" \
    "${HLS_PATH}/${QUALITY}.m3u8"
