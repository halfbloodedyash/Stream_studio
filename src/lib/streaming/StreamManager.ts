/**
 * StreamManager - Manages RTMP streaming to multiple destinations
 * Uses the backend to relay video to streaming platforms
 */

export interface StreamDestination {
    id: string;
    platform: string;
    name: string;
    rtmpUrl: string;
    streamKey: string;
    enabled: boolean;
    status: "idle" | "connecting" | "live" | "error";
    stats?: StreamStats;
    error?: string;
}

export interface StreamStats {
    bitrate: number;
    fps: number;
    droppedFrames: number;
    duration: number;
}

export interface StreamConfig {
    videoBitrate: number; // kbps
    audioBitrate: number; // kbps
    frameRate: number;
    resolution: { width: number; height: number };
    keyframeInterval: number; // seconds
}

const DEFAULT_CONFIG: StreamConfig = {
    videoBitrate: 4000,
    audioBitrate: 160,
    frameRate: 30,
    resolution: { width: 1920, height: 1080 },
    keyframeInterval: 2,
};

export class StreamManager {
    private destinations: Map<string, StreamDestination> = new Map();
    private config: StreamConfig = DEFAULT_CONFIG;
    private isStreaming: boolean = false;
    private startTime: number = 0;
    private stream: MediaStream | null = null;

    // Status callbacks
    private onStatusChange?: (destination: StreamDestination) => void;
    private onStatsUpdate?: (destinationId: string, stats: StreamStats) => void;
    private onError?: (destinationId: string, error: string) => void;

    constructor(config?: Partial<StreamConfig>) {
        if (config) {
            this.config = { ...DEFAULT_CONFIG, ...config };
        }
    }

    /**
     * Set configuration
     */
    setConfig(config: Partial<StreamConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current config
     */
    getConfig(): StreamConfig {
        return { ...this.config };
    }

    /**
     * Add a streaming destination
     */
    addDestination(destination: Omit<StreamDestination, "status" | "stats">): void {
        this.destinations.set(destination.id, {
            ...destination,
            status: "idle",
        });
    }

    /**
     * Remove a destination
     */
    removeDestination(id: string): void {
        const dest = this.destinations.get(id);
        if (dest?.status === "live") {
            this.stopDestination(id);
        }
        this.destinations.delete(id);
    }

    /**
     * Update destination
     */
    updateDestination(id: string, updates: Partial<StreamDestination>): void {
        const dest = this.destinations.get(id);
        if (dest) {
            this.destinations.set(id, { ...dest, ...updates });
        }
    }

    /**
     * Get all destinations
     */
    getDestinations(): StreamDestination[] {
        return Array.from(this.destinations.values());
    }

    /**
     * Set callback for status changes
     */
    onStatus(callback: (destination: StreamDestination) => void): void {
        this.onStatusChange = callback;
    }

    /**
     * Set callback for stats updates
     */
    onStats(callback: (destinationId: string, stats: StreamStats) => void): void {
        this.onStatsUpdate = callback;
    }

    /**
     * Set callback for errors
     */
    onErr(callback: (destinationId: string, error: string) => void): void {
        this.onError = callback;
    }

    /**
     * Start streaming to all enabled destinations
     */
    async startStreaming(stream: MediaStream): Promise<void> {
        if (this.isStreaming) {
            console.warn("Already streaming");
            return;
        }

        this.stream = stream;
        this.isStreaming = true;
        this.startTime = Date.now();

        const enabledDestinations = Array.from(this.destinations.values()).filter(
            (d) => d.enabled
        );

        // Start streaming to each destination
        await Promise.all(
            enabledDestinations.map((dest) => this.startDestination(dest.id))
        );
    }

    /**
     * Start streaming to a specific destination
     * In a real implementation, this would send the stream to a media server
     * which would then forward to RTMP endpoints
     */
    private async startDestination(id: string): Promise<void> {
        const dest = this.destinations.get(id);
        if (!dest) return;

        this.updateDestinationStatus(id, "connecting");

        try {
            // In production, this would:
            // 1. Connect to your media server via WebRTC
            // 2. The server would transcode and push to RTMP

            // Simulate connection delay
            await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

            this.updateDestinationStatus(id, "live");
            this.startStatsMonitoring(id);
        } catch (error: any) {
            this.updateDestinationStatus(id, "error", error.message);
            this.onError?.(id, error.message);
        }
    }

    /**
     * Stop streaming to a specific destination
     */
    async stopDestination(id: string): Promise<void> {
        const dest = this.destinations.get(id);
        if (!dest || dest.status === "idle") return;

        this.updateDestinationStatus(id, "idle");
    }

    /**
     * Stop all streaming
     */
    async stopStreaming(): Promise<void> {
        if (!this.isStreaming) return;

        const liveDestinations = Array.from(this.destinations.values()).filter(
            (d) => d.status === "live" || d.status === "connecting"
        );

        await Promise.all(
            liveDestinations.map((dest) => this.stopDestination(dest.id))
        );

        this.isStreaming = false;
        this.stream = null;
        this.startTime = 0;
    }

    /**
     * Update destination status and notify
     */
    private updateDestinationStatus(
        id: string,
        status: StreamDestination["status"],
        error?: string
    ): void {
        const dest = this.destinations.get(id);
        if (!dest) return;

        const updated = { ...dest, status, error };
        this.destinations.set(id, updated);
        this.onStatusChange?.(updated);
    }

    /**
     * Start monitoring stats for a destination
     */
    private startStatsMonitoring(id: string): void {
        const interval = setInterval(() => {
            const dest = this.destinations.get(id);
            if (!dest || dest.status !== "live") {
                clearInterval(interval);
                return;
            }

            // Simulate stats (in production, get from media server)
            const stats: StreamStats = {
                bitrate: this.config.videoBitrate + Math.random() * 200 - 100,
                fps: this.config.frameRate - Math.random() * 2,
                droppedFrames: Math.floor(Math.random() * 5),
                duration: Math.floor((Date.now() - this.startTime) / 1000),
            };

            const updated = { ...dest, stats };
            this.destinations.set(id, updated);
            this.onStatsUpdate?.(id, stats);
        }, 2000);
    }

    /**
     * Get streaming status
     */
    isLive(): boolean {
        return this.isStreaming;
    }

    /**
     * Get stream duration in seconds
     */
    getDuration(): number {
        if (!this.isStreaming || !this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * Format duration as HH:MM:SS
     */
    formatDuration(): string {
        const duration = this.getDuration();
        const hrs = Math.floor(duration / 3600);
        const mins = Math.floor((duration % 3600) / 60);
        const secs = duration % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.stopStreaming();
        this.destinations.clear();
        this.onStatusChange = undefined;
        this.onStatsUpdate = undefined;
        this.onError = undefined;
    }
}

// React hook
import { useState, useCallback, useRef, useEffect } from "react";

export function useStreamManager(config?: Partial<StreamConfig>) {
    const managerRef = useRef<StreamManager | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [destinations, setDestinations] = useState<StreamDestination[]>([]);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        managerRef.current = new StreamManager(config);

        managerRef.current.onStatus((dest) => {
            setDestinations(managerRef.current?.getDestinations() || []);
        });

        return () => {
            managerRef.current?.destroy();
        };
    }, []);

    // Update duration every second when streaming
    useEffect(() => {
        if (!isStreaming) return;

        const interval = setInterval(() => {
            setDuration(managerRef.current?.getDuration() || 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [isStreaming]);

    const addDestination = useCallback(
        (dest: Omit<StreamDestination, "status" | "stats">) => {
            managerRef.current?.addDestination(dest);
            setDestinations(managerRef.current?.getDestinations() || []);
        },
        []
    );

    const removeDestination = useCallback((id: string) => {
        managerRef.current?.removeDestination(id);
        setDestinations(managerRef.current?.getDestinations() || []);
    }, []);

    const updateDestination = useCallback(
        (id: string, updates: Partial<StreamDestination>) => {
            managerRef.current?.updateDestination(id, updates);
            setDestinations(managerRef.current?.getDestinations() || []);
        },
        []
    );

    const startStreaming = useCallback(async (stream: MediaStream) => {
        await managerRef.current?.startStreaming(stream);
        setIsStreaming(true);
    }, []);

    const stopStreaming = useCallback(async () => {
        await managerRef.current?.stopStreaming();
        setIsStreaming(false);
        setDuration(0);
    }, []);

    const formatDuration = useCallback(() => {
        const hrs = Math.floor(duration / 3600);
        const mins = Math.floor((duration % 3600) / 60);
        const secs = duration % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }, [duration]);

    return {
        isStreaming,
        destinations,
        duration,
        addDestination,
        removeDestination,
        updateDestination,
        startStreaming,
        stopStreaming,
        formatDuration,
    };
}
