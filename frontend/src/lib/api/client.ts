"use client";

/**
 * API Client for StreamStudio backend
 * Connects to the Node.js Express API server
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private _token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    // Getter that always reads the fresh token from localStorage
    private get token(): string | null {
        if (this._token) return this._token;
        if (typeof window !== "undefined") {
            return localStorage.getItem("auth_token");
        }
        return null;
    }

    setToken(token: string | null) {
        this._token = token;
        if (typeof window !== "undefined") {
            if (token) {
                localStorage.setItem("auth_token", token);
            } else {
                localStorage.removeItem("auth_token");
            }
        }
    }

    getToken(): string | null {
        return this.token;
    }

    private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = "GET", body, headers = {} } = options;

        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...headers,
        };

        // Always get fresh token for each request
        const currentToken = this.token;
        if (currentToken) {
            requestHeaders["Authorization"] = `Bearer ${currentToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Request failed" }));
            throw new Error(error.error || error.message || "Request failed");
        }

        return response.json();
    }

    // Auth endpoints
    auth = {
        register: (data: { email: string; password: string; name: string }) =>
            this.request<{ user: any; token: string }>("/api/auth/register", {
                method: "POST",
                body: data,
            }),

        login: (data: { email: string; password: string }) =>
            this.request<{ user: any; token: string }>("/api/auth/login", {
                method: "POST",
                body: data,
            }),

        me: () => this.request<{ user: any }>("/api/auth/me"),

        refresh: () => this.request<{ token: string }>("/api/auth/refresh", { method: "POST" }),
    };

    // Room endpoints - calls Node.js Express backend
    rooms = {
        list: (params?: { status?: string; limit?: number; offset?: number }) => {
            const query = new URLSearchParams(params as any).toString();
            return this.request<{ rooms: any[]; total: number }>(`/api/rooms?${query}`);
        },

        create: (data: { title: string; description?: string; settings?: any }) =>
            this.request<{ room: any }>("/api/rooms", { method: "POST", body: data }),

        get: (id: string) => this.request<{ room: any }>(`/api/rooms/${id}`),

        update: (id: string, data: { title?: string; description?: string; settings?: any }) =>
            this.request<{ room: any }>(`/api/rooms/${id}`, { method: "PUT", body: data }),

        delete: (id: string) => this.request<{ success: boolean }>(`/api/rooms/${id}`, { method: "DELETE" }),

        invite: (id: string, data: { name?: string; role?: string }) =>
            this.request<{ inviteToken: string; inviteUrl: string }>(`/api/rooms/${id}/invite`, {
                method: "POST",
                body: data,
            }),

        participants: (id: string) => this.request<{ participants: any[] }>(`/api/rooms/${id}/participants`),

        start: (id: string) =>
            this.request<{ success: boolean; status: string }>(`/api/rooms/${id}/start`, { method: "POST" }),

        end: (id: string) =>
            this.request<{ success: boolean; status: string }>(`/api/rooms/${id}/end`, { method: "POST" }),
    };

    // Destination endpoints
    destinations = {
        list: () => this.request<{ destinations: any[] }>("/api/destinations"),

        create: (data: {
            platform: string;
            name: string;
            rtmpUrl?: string;
            streamKey: string;
            settings?: any;
        }) => this.request<{ destination: any }>("/api/destinations", { method: "POST", body: data }),

        get: (id: string) => this.request<{ destination: any }>(`/api/destinations/${id}`),

        update: (id: string, data: { name?: string; rtmpUrl?: string; streamKey?: string }) =>
            this.request<{ destination: any }>(`/api/destinations/${id}`, { method: "PUT", body: data }),

        delete: (id: string) =>
            this.request<{ success: boolean }>(`/api/destinations/${id}`, { method: "DELETE" }),

        test: (id: string) =>
            this.request<{ success: boolean; message: string; latency?: number }>(
                `/api/destinations/${id}/test`,
                { method: "POST" }
            ),
    };

    // Asset endpoints
    assets = {
        list: (type?: string) => {
            const query = type ? `?type=${type}` : "";
            return this.request<{ assets: any[] }>(`/api/assets${query}`);
        },

        upload: async (file: File, type: string = "overlay") => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type);

            const response = await fetch(`${this.baseUrl}/api/assets/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Upload failed");
            }

            return response.json();
        },

        get: (id: string) => this.request<{ asset: any }>(`/api/assets/${id}`),

        delete: (id: string) => this.request<{ success: boolean }>(`/api/assets/${id}`, { method: "DELETE" }),
    };

    // Streaming endpoints for RTMP/YouTube Live
    streaming = {
        // Get all supported platforms and their configurations
        getPlatforms: () =>
            this.request<{
                platforms: Array<{
                    id: string;
                    name: string;
                    primaryUrl: string;
                    backupUrl: string | null;
                    recommendedBitrate: { min: number; max: number };
                    recommendedResolution: string;
                    maxKeyframeInterval: number;
                    supportedCodecs: string[];
                    supportsBackupStream: boolean;
                    helpUrl: string;
                    features: {
                        lowLatency: boolean;
                        ultraLowLatency: boolean;
                        dvr: boolean;
                        captions: boolean;
                    };
                }>;
            }>("/api/streaming/platforms"),

        // Get configuration for a specific platform
        getPlatform: (platform: string) =>
            this.request<{
                id: string;
                name: string;
                primaryUrl: string;
                backupUrl: string | null;
                recommendedBitrate: { min: number; max: number };
                features: Record<string, boolean>;
            }>(`/api/streaming/platforms/${platform}`),

        // Validate stream key format
        validateKey: (data: { platform: string; streamKey: string }) =>
            this.request<{
                valid: boolean;
                platform: string;
                message: string;
            }>("/api/streaming/validate-key", { method: "POST", body: data }),

        // Test RTMP connection
        testConnection: (data: { platform: string; streamKey: string; rtmpUrl?: string }) =>
            this.request<{
                success: boolean;
                latency?: number;
                error?: string;
                serverInfo?: string;
                platform: { name: string; features: Record<string, boolean> };
            }>("/api/streaming/test-connection", { method: "POST", body: data }),

        // Start streaming to a destination
        start: (destinationId: string, inputSource?: string) =>
            this.request<{
                success: boolean;
                message: string;
                destinationId: string;
            }>("/api/streaming/start", {
                method: "POST",
                body: { destinationId, inputSource },
            }),

        // Stop streaming to a destination
        stop: (destinationId: string) =>
            this.request<{
                success: boolean;
                message: string;
                destinationId: string;
            }>("/api/streaming/stop", {
                method: "POST",
                body: { destinationId },
            }),

        // Get status of a specific stream
        getStatus: (destinationId: string) =>
            this.request<{
                destinationId: string;
                status: "idle" | "connecting" | "live" | "error" | "reconnecting";
                error?: string;
                stats?: {
                    bitrate: number;
                    fps: number;
                    droppedFrames: number;
                    duration: number;
                    bytesTransferred: number;
                    connectionQuality: "excellent" | "good" | "fair" | "poor";
                };
                startedAt?: string;
            }>(`/api/streaming/status/${destinationId}`),

        // Get all active streams
        getActive: () =>
            this.request<{
                streams: Array<{
                    destinationId: string;
                    status: string;
                    stats?: Record<string, any>;
                }>;
            }>("/api/streaming/active"),

        // Stop all active streams
        stopAll: () =>
            this.request<{ success: boolean; message: string }>("/api/streaming/stop-all", {
                method: "POST",
            }),

        // YouTube-specific endpoints
        youtube: {
            // Get YouTube streaming recommendations
            getSettings: () =>
                this.request<{
                    platform: string;
                    name: string;
                    rtmpServers: { primary: string; backup: string };
                    recommendedSettings: {
                        video: Record<string, string>;
                        audio: Record<string, string>;
                    };
                    features: Record<string, boolean>;
                    tips: string[];
                    helpUrl: string;
                }>("/api/streaming/youtube/settings"),

            // Start YouTube Live stream
            goLive: (data: {
                streamKey: string;
                title?: string;
                description?: string;
                privacy?: "public" | "unlisted" | "private";
                enableDvr?: boolean;
                enableLowLatency?: boolean;
                inputSource?: string;
            }) =>
                this.request<{
                    success: boolean;
                    message: string;
                    destination: {
                        id: string;
                        platform: string;
                        rtmpUrl: string;
                        name: string;
                    };
                    streamUrl: string;
                    embedUrl: string;
                    connectionLatency?: number;
                }>("/api/streaming/youtube/go-live", { method: "POST", body: data }),
        },
    };

    // LiveKit Egress endpoints for real RTMP streaming
    egress = {
        // Start RTMP stream to YouTube/Twitch/etc
        startStream: (data: { roomName: string; rtmpUrl: string; streamKey: string }) =>
            this.request<{
                success: boolean;
                egressId: string;
                status: number;
                message: string;
                rtmpUrl: string;
            }>("/api/livekit/egress/start-stream", { method: "POST", body: data }),

        // Stop RTMP stream
        stopStream: (egressId: string) =>
            this.request<{
                success: boolean;
                egressId: string;
                status: number;
                message: string;
            }>("/api/livekit/egress/stop-stream", { method: "POST", body: { egressId } }),

        // List active egress sessions
        list: (roomName?: string) =>
            this.request<{
                egresses: Array<{
                    egressId: string;
                    roomName: string;
                    status: number;
                    startedAt: string;
                    endedAt?: string;
                }>;
            }>(`/api/livekit/egress/list${roomName ? `?roomName=${roomName}` : ""}`),

        // Get egress status
        getStatus: (egressId: string) =>
            this.request<{
                egressId: string;
                roomName: string;
                status: number;
                startedAt: string;
                endedAt?: string;
                error?: string;
            }>(`/api/livekit/egress/${egressId}`),

        // Start recording
        startRecording: (data: { roomName: string; filepath?: string }) =>
            this.request<{
                success: boolean;
                egressId: string;
                status: number;
                message: string;
            }>("/api/livekit/egress/start-recording", { method: "POST", body: data }),
    };
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

