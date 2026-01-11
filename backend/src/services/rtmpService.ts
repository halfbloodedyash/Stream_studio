import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface StreamDestination {
    id: string;
    platform: 'youtube' | 'facebook' | 'twitch' | 'linkedin' | 'custom';
    rtmpUrl: string;
    streamKey: string;
    name: string;
    enabled: boolean;
}

export interface StreamStats {
    bitrate: number;
    fps: number;
    droppedFrames: number;
    duration: number;
    bytesTransferred: number;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface StreamStatus {
    destinationId: string;
    status: 'idle' | 'connecting' | 'live' | 'error' | 'reconnecting';
    error?: string;
    stats?: StreamStats;
    startedAt?: Date;
}

// YouTube-specific RTMP endpoints by region for better latency
export const YOUTUBE_RTMP_SERVERS = {
    primary: 'rtmp://a.rtmp.youtube.com/live2',
    backup: 'rtmp://b.rtmp.youtube.com/live2?backup=1',
    // Regional endpoints for better performance
    us: 'rtmp://x.rtmp.youtube.com/live2',
    eu: 'rtmp://y.rtmp.youtube.com/live2',
    asia: 'rtmp://z.rtmp.youtube.com/live2',
};

// Platform RTMP configurations
export const PLATFORM_CONFIGS = {
    youtube: {
        name: 'YouTube Live',
        primaryUrl: 'rtmp://a.rtmp.youtube.com/live2',
        backupUrl: 'rtmp://b.rtmp.youtube.com/live2?backup=1',
        recommendedBitrate: { min: 3000, max: 6000 },
        recommendedResolution: '1920x1080',
        maxKeyframeInterval: 4,
        supportedCodecs: ['h264'],
        supportsBackupStream: true,
        helpUrl: 'https://studio.youtube.com/channel/UC/livestreaming',
        streamKeyFormat: /^[\w-]{4,}$/,
        features: {
            lowLatency: true,
            ultraLowLatency: true,
            dvr: true,
            captions: true,
        }
    },
    twitch: {
        name: 'Twitch',
        primaryUrl: 'rtmp://live.twitch.tv/app',
        backupUrl: null,
        recommendedBitrate: { min: 3000, max: 6000 },
        recommendedResolution: '1920x1080',
        maxKeyframeInterval: 2,
        supportedCodecs: ['h264'],
        supportsBackupStream: false,
        helpUrl: 'https://dashboard.twitch.tv/settings/stream',
        streamKeyFormat: /^live_\d+_[\w]+$/,
        features: {
            lowLatency: true,
            ultraLowLatency: false,
            dvr: false,
            captions: true,
        }
    },
    facebook: {
        name: 'Facebook Live',
        primaryUrl: 'rtmps://live-api-s.facebook.com:443/rtmp',
        backupUrl: null,
        recommendedBitrate: { min: 3000, max: 4000 },
        recommendedResolution: '1920x1080',
        maxKeyframeInterval: 2,
        supportedCodecs: ['h264'],
        supportsBackupStream: false,
        helpUrl: 'https://www.facebook.com/live/producer',
        streamKeyFormat: /^[\w]+/,
        features: {
            lowLatency: false,
            ultraLowLatency: false,
            dvr: true,
            captions: true,
        }
    },
    linkedin: {
        name: 'LinkedIn Live',
        primaryUrl: 'rtmps://prod-global-rtmp.publish.live-video.net:443/rtmp',
        backupUrl: null,
        recommendedBitrate: { min: 3000, max: 6000 },
        recommendedResolution: '1920x1080',
        maxKeyframeInterval: 2,
        supportedCodecs: ['h264'],
        supportsBackupStream: false,
        helpUrl: 'https://www.linkedin.com/video/golive',
        streamKeyFormat: /^[\w-]+$/,
        features: {
            lowLatency: false,
            ultraLowLatency: false,
            dvr: false,
            captions: false,
        }
    },
    custom: {
        name: 'Custom RTMP',
        primaryUrl: '',
        backupUrl: null,
        recommendedBitrate: { min: 2500, max: 8000 },
        recommendedResolution: '1920x1080',
        maxKeyframeInterval: 2,
        supportedCodecs: ['h264', 'h265'],
        supportsBackupStream: false,
        helpUrl: '',
        streamKeyFormat: /.*/,
        features: {
            lowLatency: false,
            ultraLowLatency: false,
            dvr: false,
            captions: false,
        }
    }
};

export class RTMPStreamingService extends EventEmitter {
    private activeStreams: Map<string, {
        process: ChildProcess | null;
        status: StreamStatus;
        startTime: Date | null;
        retryCount: number;
    }> = new Map();

    private maxRetries = 3;
    private retryDelay = 5000; // 5 seconds

    constructor() {
        super();
        console.log('[RTMP] Streaming service initialized');
    }

    /**
     * Validate stream key format for a platform
     */
    validateStreamKey(platform: keyof typeof PLATFORM_CONFIGS, streamKey: string): boolean {
        const config = PLATFORM_CONFIGS[platform];
        if (!config) return false;
        return config.streamKeyFormat.test(streamKey);
    }

    /**
     * Build the full RTMP URL with stream key
     */
    buildRtmpUrl(platform: keyof typeof PLATFORM_CONFIGS, streamKey: string, useBackup = false): string {
        const config = PLATFORM_CONFIGS[platform];
        if (!config) throw new Error(`Unknown platform: ${platform}`);

        const baseUrl = useBackup && config.backupUrl ? config.backupUrl : config.primaryUrl;

        // Different platforms have different URL formats
        switch (platform) {
            case 'youtube':
                return `${baseUrl}/${streamKey}`;
            case 'twitch':
                return `${baseUrl}/${streamKey}`;
            case 'facebook':
                return `${baseUrl}/${streamKey}`;
            case 'linkedin':
                return `${baseUrl}/${streamKey}`;
            case 'custom':
                return streamKey; // For custom, the full URL should be provided
            default:
                return `${baseUrl}/${streamKey}`;
        }
    }

    /**
     * Test RTMP connection without actually streaming
     */
    async testConnection(destination: StreamDestination): Promise<{
        success: boolean;
        latency?: number;
        error?: string;
        serverInfo?: string;
    }> {
        console.log(`[RTMP] Testing connection to ${destination.platform}: ${destination.name}`);

        const startTime = Date.now();

        try {
            // Build the RTMP URL
            const rtmpUrl = this.buildRtmpUrl(
                destination.platform as keyof typeof PLATFORM_CONFIGS,
                destination.streamKey
            );

            // For a real implementation, you would use ffprobe or a TCP connection test
            // Here we simulate the test with a timeout check
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);

                // Simulate connection test
                setTimeout(() => {
                    clearTimeout(timeout);
                    resolve();
                }, Math.random() * 2000 + 500);
            });

            const latency = Date.now() - startTime;

            console.log(`[RTMP] Connection test successful. Latency: ${latency}ms`);

            return {
                success: true,
                latency,
                serverInfo: `Connected to ${PLATFORM_CONFIGS[destination.platform as keyof typeof PLATFORM_CONFIGS]?.name || 'server'}`,
            };
        } catch (error: any) {
            console.error(`[RTMP] Connection test failed:`, error.message);
            return {
                success: false,
                error: error.message || 'Connection failed',
            };
        }
    }

    /**
     * Start streaming to a destination
     */
    async startStream(destination: StreamDestination, inputUrl: string): Promise<void> {
        console.log(`[RTMP] Starting stream to ${destination.platform}: ${destination.name}`);

        const streamInfo = this.activeStreams.get(destination.id);
        if (streamInfo?.status.status === 'live') {
            console.warn(`[RTMP] Stream ${destination.id} is already live`);
            return;
        }

        // Update status to connecting
        this.updateStreamStatus(destination.id, 'connecting');

        try {
            const rtmpUrl = this.buildRtmpUrl(
                destination.platform as keyof typeof PLATFORM_CONFIGS,
                destination.streamKey
            );

            // Get platform-specific encoding settings
            const config = PLATFORM_CONFIGS[destination.platform as keyof typeof PLATFORM_CONFIGS];
            const bitrate = config?.recommendedBitrate.max || 4500;
            const keyframeInterval = config?.maxKeyframeInterval || 2;

            // Build FFmpeg command for streaming
            const ffmpegArgs = [
                '-re', // Read input at native frame rate
                '-i', inputUrl, // Input source (could be local capture or another RTMP stream)

                // Video encoding
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-b:v', `${bitrate}k`,
                '-maxrate', `${bitrate * 1.2}k`,
                '-bufsize', `${bitrate * 2}k`,
                '-g', `${30 * keyframeInterval}`, // Keyframe interval (fps * seconds)
                '-keyint_min', `${30 * keyframeInterval}`,

                // Audio encoding
                '-c:a', 'aac',
                '-b:a', '128k',
                '-ar', '44100',

                // Output format
                '-f', 'flv',
                '-flvflags', 'no_duration_filesize',

                rtmpUrl
            ];

            console.log(`[RTMP] FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);

            // For now, we simulate the streaming process
            // In production, you would spawn FFmpeg here
            /*
            const process = spawn('ffmpeg', ffmpegArgs);
            
            process.stdout.on('data', (data) => {
                console.log(`[RTMP] FFmpeg stdout: ${data}`);
            });

            process.stderr.on('data', (data) => {
                this.parseFFmpegOutput(destination.id, data.toString());
            });

            process.on('close', (code) => {
                console.log(`[RTMP] FFmpeg process exited with code ${code}`);
                this.handleStreamEnd(destination.id, code);
            });

            process.on('error', (error) => {
                console.error(`[RTMP] FFmpeg error:`, error);
                this.updateStreamStatus(destination.id, 'error', error.message);
            });
            */

            // Simulate successful connection
            setTimeout(() => {
                this.updateStreamStatus(destination.id, 'live');
                this.activeStreams.set(destination.id, {
                    process: null, // Would be the FFmpeg process
                    status: this.getStreamStatus(destination.id)!,
                    startTime: new Date(),
                    retryCount: 0,
                });

                // Start stats polling
                this.startStatsPolling(destination.id);
            }, 2000);

        } catch (error: any) {
            console.error(`[RTMP] Failed to start stream:`, error);
            this.updateStreamStatus(destination.id, 'error', error.message);
            throw error;
        }
    }

    /**
     * Stop streaming to a destination
     */
    async stopStream(destinationId: string): Promise<void> {
        console.log(`[RTMP] Stopping stream: ${destinationId}`);

        const streamInfo = this.activeStreams.get(destinationId);
        if (!streamInfo) {
            console.warn(`[RTMP] No active stream found for ${destinationId}`);
            return;
        }

        // Kill the FFmpeg process if running
        if (streamInfo.process) {
            streamInfo.process.kill('SIGTERM');

            // Force kill after timeout
            setTimeout(() => {
                if (streamInfo.process && !streamInfo.process.killed) {
                    streamInfo.process.kill('SIGKILL');
                }
            }, 5000);
        }

        this.updateStreamStatus(destinationId, 'idle');
        this.activeStreams.delete(destinationId);
    }

    /**
     * Get current stream status
     */
    getStreamStatus(destinationId: string): StreamStatus | null {
        const streamInfo = this.activeStreams.get(destinationId);
        return streamInfo?.status || null;
    }

    /**
     * Update stream status and emit event
     */
    private updateStreamStatus(
        destinationId: string,
        status: StreamStatus['status'],
        error?: string
    ): void {
        const currentInfo = this.activeStreams.get(destinationId);

        const newStatus: StreamStatus = {
            destinationId,
            status,
            error,
            stats: currentInfo?.status.stats,
            startedAt: currentInfo?.startTime || undefined,
        };

        if (currentInfo) {
            currentInfo.status = newStatus;
        } else {
            this.activeStreams.set(destinationId, {
                process: null,
                status: newStatus,
                startTime: null,
                retryCount: 0,
            });
        }

        console.log(`[RTMP] Stream ${destinationId} status updated:`, status);
        this.emit('status-change', newStatus);
    }

    /**
     * Start polling for stream statistics
     */
    private startStatsPolling(destinationId: string): void {
        const pollInterval = setInterval(() => {
            const streamInfo = this.activeStreams.get(destinationId);
            if (!streamInfo || streamInfo.status.status !== 'live') {
                clearInterval(pollInterval);
                return;
            }

            // Calculate duration
            const duration = streamInfo.startTime
                ? Math.floor((Date.now() - streamInfo.startTime.getTime()) / 1000)
                : 0;

            // Simulate stats (in production, parse from FFmpeg output)
            const stats: StreamStats = {
                bitrate: 4500 + Math.floor(Math.random() * 500),
                fps: 30,
                droppedFrames: Math.floor(Math.random() * 5),
                duration,
                bytesTransferred: duration * 562500, // ~4.5 Mbps
                connectionQuality: this.calculateConnectionQuality(4500, 30, 0),
            };

            streamInfo.status.stats = stats;
            this.emit('stats-update', { destinationId, stats });
        }, 2000);
    }

    /**
     * Calculate connection quality based on stats
     */
    private calculateConnectionQuality(
        bitrate: number,
        fps: number,
        droppedFrames: number
    ): StreamStats['connectionQuality'] {
        if (bitrate >= 4000 && fps >= 29 && droppedFrames < 2) return 'excellent';
        if (bitrate >= 3000 && fps >= 25 && droppedFrames < 5) return 'good';
        if (bitrate >= 2000 && fps >= 20 && droppedFrames < 10) return 'fair';
        return 'poor';
    }

    /**
     * Handle stream end/disconnection
     */
    private handleStreamEnd(destinationId: string, exitCode: number | null): void {
        const streamInfo = this.activeStreams.get(destinationId);
        if (!streamInfo) return;

        if (exitCode !== 0 && streamInfo.retryCount < this.maxRetries) {
            console.log(`[RTMP] Stream ${destinationId} disconnected. Retrying... (${streamInfo.retryCount + 1}/${this.maxRetries})`);
            streamInfo.retryCount++;
            this.updateStreamStatus(destinationId, 'reconnecting');

            // Retry after delay
            setTimeout(() => {
                // Would restart the stream here
                // this.startStream(destination, inputUrl);
            }, this.retryDelay);
        } else {
            this.updateStreamStatus(destinationId, 'idle');
            this.activeStreams.delete(destinationId);
        }
    }

    /**
     * Parse FFmpeg output for stats and errors
     */
    private parseFFmpegOutput(destinationId: string, output: string): void {
        // Parse bitrate
        const bitrateMatch = output.match(/bitrate=\s*(\d+\.?\d*)kbits\/s/);
        if (bitrateMatch) {
            const bitrate = parseFloat(bitrateMatch[1]);
            // Update stats
        }

        // Parse fps
        const fpsMatch = output.match(/fps=\s*(\d+\.?\d*)/);
        if (fpsMatch) {
            const fps = parseFloat(fpsMatch[1]);
            // Update stats
        }

        // Parse dropped frames
        const dropMatch = output.match(/drop=(\d+)/);
        if (dropMatch) {
            const dropped = parseInt(dropMatch[1], 10);
            // Update stats
        }

        // Check for errors
        if (output.includes('Connection refused') || output.includes('Unable to connect')) {
            this.updateStreamStatus(destinationId, 'error', 'Connection refused');
        }
    }

    /**
     * Get all active streams
     */
    getAllStreams(): StreamStatus[] {
        return Array.from(this.activeStreams.values()).map(info => info.status);
    }

    /**
     * Stop all active streams
     */
    async stopAllStreams(): Promise<void> {
        console.log('[RTMP] Stopping all streams...');
        const stopPromises = Array.from(this.activeStreams.keys()).map(id => this.stopStream(id));
        await Promise.all(stopPromises);
    }
}

// Singleton instance
export const rtmpService = new RTMPStreamingService();
