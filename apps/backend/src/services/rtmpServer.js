import NodeMediaServer from 'node-media-server';
import { supabase } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

let nms = null;
let ioInstance = null;

// Check if ffmpeg exists before enabling transcoding
const ffmpegPath = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
const enableTranscoding = process.env.ENABLE_TRANSCODING === 'true';

const config = {
    rtmp: {
        port: parseInt(process.env.RTMP_PORT) || 1936,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: parseInt(process.env.RTMP_HTTP_PORT) || 8001,
        allow_origin: '*',
        mediaroot: process.env.HLS_OUTPUT_DIR || './media'
    }
};

// Only add trans config if transcoding is explicitly enabled
// This avoids the "version is not defined" error in node-media-server
if (enableTranscoding) {
    config.trans = {
        ffmpeg: ffmpegPath,
        tasks: [
            {
                app: 'live',
                hls: true,
                hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                hlsKeep: false
            }
        ]
    };
    console.log('[RTMP] Transcoding enabled with ffmpeg:', ffmpegPath);
} else {
    console.log('[RTMP] Transcoding disabled - set ENABLE_TRANSCODING=true to enable');
}

/**
 * Validate stream key against database
 */
async function validateStreamKey(streamKey) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('id, name, status, owner_id')
            .eq('rtmp_stream_key', streamKey)
            .single();

        if (error || !data) {
            console.log(`[RTMP] Invalid stream key: ${streamKey}`);
            return null;
        }

        // Return in format expected by other functions
        return {
            id: data.id,
            project_id: data.id,  // Use project ID
            name: data.name,
            status: data.status,
            owner_id: data.owner_id,
            is_active: true
        };
    } catch (err) {
        console.error('[RTMP] Stream key validation error:', err);
        return null;
    }
}

/**
 * Update stream status in database
 */
async function updateStreamStatus(streamKey, status) {
    try {
        const updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };

        // Update started_at when stream goes live
        if (status === 'LIVE') {
            updateData.started_at = new Date().toISOString();
        }

        // Update ended_at when stream ends
        if (status === 'ENDED') {
            updateData.ended_at = new Date().toISOString();
        }

        await supabase
            .from('projects')
            .update(updateData)
            .eq('rtmp_stream_key', streamKey);

        console.log(`[RTMP] Project stream status updated to ${status} for key ${streamKey}`);
    } catch (err) {
        console.error('[RTMP] Error updating stream status:', err);
    }
}

/**
 * Notify connected clients via WebSocket
 */
function notifyStreamStatus(projectId, status, streamKey) {
    if (ioInstance) {
        ioInstance.emit('stream_status', {
            projectId,
            status,
            streamKey,
            timestamp: Date.now()
        });
        console.log(`[RTMP] Notified clients: project ${projectId} is ${status}`);
    }
}

/**
 * Start the RTMP Media Server
 */
export function startRtmpServer(io = null) {
    ioInstance = io;

    nms = new NodeMediaServer(config);

    // Pre-publish authentication
    nms.on('prePublish', async (id, StreamPath, args) => {
        console.log(`[RTMP] Pre-publish: id=${id}, StreamPath=${StreamPath}`);

        // Extract stream key from path (format: /live/STREAM_KEY)
        const pathParts = StreamPath.split('/');
        const streamKey = pathParts[pathParts.length - 1];

        if (!streamKey) {
            console.log(`[RTMP] Rejecting stream - no stream key provided`);
            const session = nms.getSession(id);
            if (session) session.reject();
            return;
        }

        // Validate stream key
        const ingestConfig = await validateStreamKey(streamKey);
        if (!ingestConfig) {
            console.log(`[RTMP] Rejecting stream - invalid stream key: ${streamKey}`);
            const session = nms.getSession(id);
            if (session) session.reject();
            return;
        }

        console.log(`[RTMP] Stream authorized for project: ${ingestConfig.project_id}`);
    });

    // Post-publish (stream started)
    nms.on('postPublish', async (id, StreamPath, args) => {
        console.log(`[RTMP] Stream started: id=${id}, StreamPath=${StreamPath}`);

        const pathParts = StreamPath.split('/');
        const streamKey = pathParts[pathParts.length - 1];

        const ingestConfig = await validateStreamKey(streamKey);
        if (ingestConfig) {
            await updateStreamStatus(streamKey, 'LIVE');
            notifyStreamStatus(ingestConfig.project_id, 'LIVE', streamKey);
        }
    });

    // Done publish (stream ended)
    nms.on('donePublish', async (id, StreamPath, args) => {
        console.log(`[RTMP] Stream ended: id=${id}, StreamPath=${StreamPath}`);

        const pathParts = StreamPath.split('/');
        const streamKey = pathParts[pathParts.length - 1];

        const ingestConfig = await validateStreamKey(streamKey);
        if (ingestConfig) {
            await updateStreamStatus(streamKey, 'ENDED');
            notifyStreamStatus(ingestConfig.project_id, 'ENDED', streamKey);
        }
    });

    // Pre-play authentication (optional - for playback protection)
    nms.on('prePlay', (id, StreamPath, args) => {
        console.log(`[RTMP] Pre-play: id=${id}, StreamPath=${StreamPath}`);
        // Allow all playback for now, can add auth later
    });

    nms.run();

    console.log(`[RTMP] Server started on rtmp://localhost:${config.rtmp.port}/live`);
    console.log(`[RTMP] HTTP-FLV available on http://localhost:${config.http.port}`);

    return nms;
}

/**
 * Stop the RTMP server
 */
export function stopRtmpServer() {
    if (nms) {
        nms.stop();
        nms = null;
        console.log('[RTMP] Server stopped');
    }
}

/**
 * Get RTMP server info
 */
export function getRtmpServerInfo() {
    return {
        rtmpUrl: `rtmp://localhost:${config.rtmp.port}/live`,
        httpFlvUrl: `http://localhost:${config.http.port}`,
        isRunning: nms !== null
    };
}

export default {
    startRtmpServer,
    stopRtmpServer,
    getRtmpServerInfo
};
