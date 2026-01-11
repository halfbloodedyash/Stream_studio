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
export declare const YOUTUBE_RTMP_SERVERS: {
    primary: string;
    backup: string;
    us: string;
    eu: string;
    asia: string;
};
export declare const PLATFORM_CONFIGS: {
    youtube: {
        name: string;
        primaryUrl: string;
        backupUrl: string;
        recommendedBitrate: {
            min: number;
            max: number;
        };
        recommendedResolution: string;
        maxKeyframeInterval: number;
        supportedCodecs: string[];
        supportsBackupStream: boolean;
        helpUrl: string;
        streamKeyFormat: RegExp;
        features: {
            lowLatency: boolean;
            ultraLowLatency: boolean;
            dvr: boolean;
            captions: boolean;
        };
    };
    twitch: {
        name: string;
        primaryUrl: string;
        backupUrl: null;
        recommendedBitrate: {
            min: number;
            max: number;
        };
        recommendedResolution: string;
        maxKeyframeInterval: number;
        supportedCodecs: string[];
        supportsBackupStream: boolean;
        helpUrl: string;
        streamKeyFormat: RegExp;
        features: {
            lowLatency: boolean;
            ultraLowLatency: boolean;
            dvr: boolean;
            captions: boolean;
        };
    };
    facebook: {
        name: string;
        primaryUrl: string;
        backupUrl: null;
        recommendedBitrate: {
            min: number;
            max: number;
        };
        recommendedResolution: string;
        maxKeyframeInterval: number;
        supportedCodecs: string[];
        supportsBackupStream: boolean;
        helpUrl: string;
        streamKeyFormat: RegExp;
        features: {
            lowLatency: boolean;
            ultraLowLatency: boolean;
            dvr: boolean;
            captions: boolean;
        };
    };
    linkedin: {
        name: string;
        primaryUrl: string;
        backupUrl: null;
        recommendedBitrate: {
            min: number;
            max: number;
        };
        recommendedResolution: string;
        maxKeyframeInterval: number;
        supportedCodecs: string[];
        supportsBackupStream: boolean;
        helpUrl: string;
        streamKeyFormat: RegExp;
        features: {
            lowLatency: boolean;
            ultraLowLatency: boolean;
            dvr: boolean;
            captions: boolean;
        };
    };
    custom: {
        name: string;
        primaryUrl: string;
        backupUrl: null;
        recommendedBitrate: {
            min: number;
            max: number;
        };
        recommendedResolution: string;
        maxKeyframeInterval: number;
        supportedCodecs: string[];
        supportsBackupStream: boolean;
        helpUrl: string;
        streamKeyFormat: RegExp;
        features: {
            lowLatency: boolean;
            ultraLowLatency: boolean;
            dvr: boolean;
            captions: boolean;
        };
    };
};
export declare class RTMPStreamingService extends EventEmitter {
    private activeStreams;
    private maxRetries;
    private retryDelay;
    constructor();
    /**
     * Validate stream key format for a platform
     */
    validateStreamKey(platform: keyof typeof PLATFORM_CONFIGS, streamKey: string): boolean;
    /**
     * Build the full RTMP URL with stream key
     */
    buildRtmpUrl(platform: keyof typeof PLATFORM_CONFIGS, streamKey: string, useBackup?: boolean): string;
    /**
     * Test RTMP connection without actually streaming
     */
    testConnection(destination: StreamDestination): Promise<{
        success: boolean;
        latency?: number;
        error?: string;
        serverInfo?: string;
    }>;
    /**
     * Start streaming to a destination
     */
    startStream(destination: StreamDestination, inputUrl: string): Promise<void>;
    /**
     * Stop streaming to a destination
     */
    stopStream(destinationId: string): Promise<void>;
    /**
     * Get current stream status
     */
    getStreamStatus(destinationId: string): StreamStatus | null;
    /**
     * Update stream status and emit event
     */
    private updateStreamStatus;
    /**
     * Start polling for stream statistics
     */
    private startStatsPolling;
    /**
     * Calculate connection quality based on stats
     */
    private calculateConnectionQuality;
    /**
     * Handle stream end/disconnection
     */
    private handleStreamEnd;
    /**
     * Parse FFmpeg output for stats and errors
     */
    private parseFFmpegOutput;
    /**
     * Get all active streams
     */
    getAllStreams(): StreamStatus[];
    /**
     * Stop all active streams
     */
    stopAllStreams(): Promise<void>;
}
export declare const rtmpService: RTMPStreamingService;
//# sourceMappingURL=rtmpService.d.ts.map