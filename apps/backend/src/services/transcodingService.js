import ffmpeg from 'fluent-ffmpeg';
import { supabase } from '../config/database.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const FFMPEG_PATH = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
const HLS_OUTPUT_DIR = process.env.HLS_OUTPUT_DIR || './media/hls';
const HLS_BASE_URL = process.env.HLS_BASE_URL || 'http://localhost:8000/hls';

// Set ffmpeg path
ffmpeg.setFfmpegPath(FFMPEG_PATH);

// Store active transcoding processes
const activeJobs = new Map();

/**
 * Get transcoding profiles from database
 */
export async function getTranscodingProfiles(onlyDefaults = false) {
    try {
        let query = supabase.from('transcoding_profiles').select('*');

        if (onlyDefaults) {
            query = query.eq('is_default', true);
        }

        const { data, error } = await query.order('height', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('[Transcoding] Error getting profiles:', err);
        return [];
    }
}

/**
 * Create output directory for HLS files
 */
function ensureOutputDir(streamId) {
    const outputDir = path.join(HLS_OUTPUT_DIR, streamId);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
}

/**
 * Update job status in database
 */
async function updateJobStatus(jobId, status, additionalData = {}) {
    try {
        const updateData = {
            status,
            ...additionalData
        };

        if (status === 'PROCESSING') {
            updateData.started_at = new Date().toISOString();
        } else if (status === 'COMPLETED' || status === 'FAILED') {
            updateData.completed_at = new Date().toISOString();
        }

        await supabase
            .from('transcoding_jobs')
            .update(updateData)
            .eq('id', jobId);

        console.log(`[Transcoding] Job ${jobId} status updated to ${status}`);
    } catch (err) {
        console.error('[Transcoding] Error updating job status:', err);
    }
}

/**
 * Start a transcoding job for a single profile
 */
export async function startTranscodingJob(jobId, inputUrl, profile, streamId) {
    return new Promise(async (resolve, reject) => {
        try {
            const outputDir = ensureOutputDir(streamId);
            const outputName = `${profile.name}.m3u8`;
            const outputPath = path.join(outputDir, outputName);
            const hlsPlaylistUrl = `${HLS_BASE_URL}/${streamId}/${outputName}`;

            console.log(`[Transcoding] Starting job ${jobId} for profile ${profile.name}`);
            console.log(`[Transcoding] Input: ${inputUrl}`);
            console.log(`[Transcoding] Output: ${outputPath}`);

            await updateJobStatus(jobId, 'PROCESSING');

            const command = ffmpeg(inputUrl)
                .outputOptions([
                    // Video settings
                    '-c:v libx264',
                    `-b:v ${profile.video_bitrate}`,
                    `-s ${profile.width}x${profile.height}`,
                    `-r ${profile.framerate || 30}`,
                    `-preset ${profile.preset || 'veryfast'}`,
                    '-profile:v main',
                    '-level 3.1',

                    // Audio settings
                    '-c:a aac',
                    `-b:a ${profile.audio_bitrate}`,
                    '-ar 48000',
                    '-ac 2',

                    // HLS settings
                    '-f hls',
                    '-hls_time 4',
                    '-hls_list_size 10',
                    '-hls_flags delete_segments+append_list',
                    '-hls_segment_filename', path.join(outputDir, `${profile.name}_%03d.ts`)
                ])
                .output(outputPath);

            // Track progress
            command.on('progress', async (progress) => {
                const percent = Math.round(progress.percent || 0);
                if (percent % 10 === 0) { // Update every 10%
                    await updateJobStatus(jobId, 'PROCESSING', { progress: percent });
                }
            });

            command.on('start', (commandLine) => {
                console.log(`[Transcoding] FFmpeg command: ${commandLine}`);
                activeJobs.set(jobId, command);
            });

            command.on('error', async (err, stdout, stderr) => {
                console.error(`[Transcoding] Job ${jobId} failed:`, err.message);
                activeJobs.delete(jobId);
                await updateJobStatus(jobId, 'FAILED', {
                    error_message: err.message,
                    progress: 0
                });
                reject(err);
            });

            command.on('end', async () => {
                console.log(`[Transcoding] Job ${jobId} completed successfully`);
                activeJobs.delete(jobId);
                await updateJobStatus(jobId, 'COMPLETED', {
                    output_url: outputPath,
                    hls_playlist_url: hlsPlaylistUrl,
                    progress: 100
                });
                resolve({
                    jobId,
                    outputPath,
                    hlsPlaylistUrl,
                    profile: profile.name
                });
            });

            command.run();

        } catch (err) {
            console.error(`[Transcoding] Error starting job ${jobId}:`, err);
            await updateJobStatus(jobId, 'FAILED', { error_message: err.message });
            reject(err);
        }
    });
}

/**
 * Start transcoding for all default profiles
 */
export async function startMultiProfileTranscoding(streamId, inputUrl) {
    try {
        const profiles = await getTranscodingProfiles(true);

        if (profiles.length === 0) {
            throw new Error('No default transcoding profiles found');
        }

        const jobs = [];

        for (const profile of profiles) {
            // Create job in database
            const { data: job, error } = await supabase
                .from('transcoding_jobs')
                .insert({
                    stream_id: streamId,
                    profile_id: profile.id,
                    input_url: inputUrl,
                    status: 'PENDING'
                })
                .select()
                .single();

            if (error) {
                console.error(`[Transcoding] Error creating job for profile ${profile.name}:`, error);
                continue;
            }

            jobs.push({
                job,
                profile
            });
        }

        // Start all jobs (non-blocking)
        const results = [];
        for (const { job, profile } of jobs) {
            startTranscodingJob(job.id, inputUrl, profile, streamId)
                .then(result => results.push(result))
                .catch(err => console.error(`[Transcoding] Job ${job.id} failed:`, err));
        }

        return jobs.map(j => ({ jobId: j.job.id, profile: j.profile.name, status: 'PENDING' }));

    } catch (err) {
        console.error('[Transcoding] Error starting multi-profile transcoding:', err);
        throw err;
    }
}

/**
 * Stop a running transcoding job
 */
export function stopTranscodingJob(jobId) {
    const command = activeJobs.get(jobId);
    if (command) {
        command.kill('SIGKILL');
        activeJobs.delete(jobId);
        console.log(`[Transcoding] Job ${jobId} stopped`);
        return true;
    }
    return false;
}

/**
 * Get active job count
 */
export function getActiveJobCount() {
    return activeJobs.size;
}

/**
 * Generate master HLS playlist for adaptive streaming
 */
export async function generateMasterPlaylist(streamId) {
    try {
        const outputDir = path.join(HLS_OUTPUT_DIR, streamId);
        const masterPath = path.join(outputDir, 'master.m3u8');

        // Get all completed jobs for this stream
        const { data: jobs, error } = await supabase
            .from('transcoding_jobs')
            .select(`
                *,
                transcoding_profiles (*)
            `)
            .eq('stream_id', streamId)
            .eq('status', 'COMPLETED');

        if (error || !jobs || jobs.length === 0) {
            throw new Error('No completed transcoding jobs found');
        }

        // Build master playlist
        let playlistContent = '#EXTM3U\n#EXT-X-VERSION:3\n';

        for (const job of jobs) {
            const profile = job.transcoding_profiles;
            const bandwidth = parseInt(profile.video_bitrate) * 1000; // Convert k to bits

            playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${profile.width}x${profile.height}\n`;
            playlistContent += `${profile.name}.m3u8\n`;
        }

        fs.writeFileSync(masterPath, playlistContent);

        const masterUrl = `${HLS_BASE_URL}/${streamId}/master.m3u8`;
        console.log(`[Transcoding] Master playlist generated: ${masterUrl}`);

        return masterUrl;

    } catch (err) {
        console.error('[Transcoding] Error generating master playlist:', err);
        throw err;
    }
}

export default {
    getTranscodingProfiles,
    startTranscodingJob,
    startMultiProfileTranscoding,
    stopTranscodingJob,
    getActiveJobCount,
    generateMasterPlaylist
};
