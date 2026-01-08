/**
 * RecordingManager - Handles local and cloud recording using MediaRecorder API
 */

export interface RecordingOptions {
    mimeType?: string;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
}

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    size: number;
}

export class RecordingManager {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private startTime: number = 0;
    private pauseTime: number = 0;
    private totalPausedTime: number = 0;
    private durationInterval: NodeJS.Timeout | null = null;
    private options: RecordingOptions;

    // Callbacks
    private onStateChange?: (state: RecordingState) => void;
    private onDataAvailable?: (blob: Blob) => void;
    private onError?: (error: Error) => void;

    constructor(options: RecordingOptions = {}) {
        this.options = {
            mimeType: this.getSupportedMimeType(),
            videoBitsPerSecond: 2500000, // 2.5 Mbps
            audioBitsPerSecond: 128000, // 128 kbps
            ...options,
        };
    }

    /**
     * Get supported MIME type for recording
     */
    private getSupportedMimeType(): string {
        const types = [
            "video/mp4;codecs=h264,aac",
            "video/mp4;codecs=h264",
            "video/mp4",
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return "video/webm";
    }

    /**
     * Set callback for state changes
     */
    onState(callback: (state: RecordingState) => void): void {
        this.onStateChange = callback;
    }

    /**
     * Set callback for data availability
     */
    onData(callback: (blob: Blob) => void): void {
        this.onDataAvailable = callback;
    }

    /**
     * Set callback for errors
     */
    onErr(callback: (error: Error) => void): void {
        this.onError = callback;
    }

    /**
     * Start recording
     */
    start(stream: MediaStream): void {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            console.warn("Recording already in progress");
            return;
        }

        try {
            this.stream = stream;
            this.recordedChunks = [];
            this.totalPausedTime = 0;

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: this.options.mimeType,
                videoBitsPerSecond: this.options.videoBitsPerSecond,
                audioBitsPerSecond: this.options.audioBitsPerSecond,
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    this.onDataAvailable?.(event.data);
                }
            };

            this.mediaRecorder.onerror = (event: any) => {
                this.onError?.(new Error(event.error?.message || "Recording error"));
            };

            this.mediaRecorder.onstop = () => {
                this.stopDurationTimer();
            };

            // Request data every second for live stats
            this.mediaRecorder.start(1000);
            this.startTime = Date.now();
            this.startDurationTimer();

            this.notifyStateChange();
        } catch (error: any) {
            this.onError?.(error);
        }
    }

    /**
     * Stop recording
     */
    stop(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error("No recording in progress"));
                return;
            }

            this.mediaRecorder.onstop = () => {
                this.stopDurationTimer();
                const blob = new Blob(this.recordedChunks, {
                    type: this.options.mimeType,
                });
                this.notifyStateChange();
                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Pause recording
     */
    pause(): void {
        if (this.mediaRecorder?.state === "recording") {
            this.mediaRecorder.pause();
            this.pauseTime = Date.now();
            this.notifyStateChange();
        }
    }

    /**
     * Resume recording
     */
    resume(): void {
        if (this.mediaRecorder?.state === "paused") {
            this.totalPausedTime += Date.now() - this.pauseTime;
            this.mediaRecorder.resume();
            this.notifyStateChange();
        }
    }

    /**
     * Get current recording state
     */
    getState(): RecordingState {
        const isRecording = this.mediaRecorder?.state === "recording";
        const isPaused = this.mediaRecorder?.state === "paused";

        let duration = 0;
        if (this.startTime > 0) {
            duration = Math.floor(
                (Date.now() - this.startTime - this.totalPausedTime) / 1000
            );
            if (isPaused) {
                duration = Math.floor(
                    (this.pauseTime - this.startTime - this.totalPausedTime) / 1000
                );
            }
        }

        const size = this.recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0);

        return {
            isRecording,
            isPaused,
            duration,
            size,
        };
    }

    /**
     * Download the recording
     */
    download(filename: string = "recording"): void {
        const blob = new Blob(this.recordedChunks, {
            type: this.options.mimeType,
        });

        const extension = this.options.mimeType?.includes("mp4") ? "mp4" : "webm";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get recording as blob
     */
    getBlob(): Blob {
        return new Blob(this.recordedChunks, {
            type: this.options.mimeType,
        });
    }

    /**
     * Get recording as data URL
     */
    async getDataUrl(): Promise<string> {
        const blob = this.getBlob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Start duration timer
     */
    private startDurationTimer(): void {
        this.durationInterval = setInterval(() => {
            this.notifyStateChange();
        }, 1000);
    }

    /**
     * Stop duration timer
     */
    private stopDurationTimer(): void {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
    }

    /**
     * Notify state change
     */
    private notifyStateChange(): void {
        this.onStateChange?.(this.getState());
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.stopDurationTimer();
        if (this.mediaRecorder?.state !== "inactive") {
            this.mediaRecorder?.stop();
        }
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
    }
}

// Helper hook for React
import { useState, useCallback, useRef, useEffect } from "react";

export function useRecording() {
    const managerRef = useRef<RecordingManager | null>(null);
    const [state, setState] = useState<RecordingState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        size: 0,
    });

    useEffect(() => {
        managerRef.current = new RecordingManager();
        managerRef.current.onState(setState);

        return () => {
            managerRef.current?.destroy();
        };
    }, []);

    const start = useCallback((stream: MediaStream) => {
        managerRef.current?.start(stream);
    }, []);

    const stop = useCallback(async () => {
        return managerRef.current?.stop();
    }, []);

    const pause = useCallback(() => {
        managerRef.current?.pause();
    }, []);

    const resume = useCallback(() => {
        managerRef.current?.resume();
    }, []);

    const download = useCallback((filename?: string) => {
        managerRef.current?.download(filename);
    }, []);

    const getBlob = useCallback(() => {
        return managerRef.current?.getBlob();
    }, []);

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return {
        ...state,
        start,
        stop,
        pause,
        resume,
        download,
        getBlob,
        formatDuration: () => formatDuration(state.duration),
        formatSize: () => formatSize(state.size),
    };
}
