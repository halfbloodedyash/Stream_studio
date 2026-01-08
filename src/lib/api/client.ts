"use client";

/**
 * API Client for StreamStudio backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        // Load token from localStorage if available
        if (typeof window !== "undefined") {
            this.token = localStorage.getItem("auth_token");
        }
    }

    setToken(token: string | null) {
        this.token = token;
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

        if (this.token) {
            requestHeaders["Authorization"] = `Bearer ${this.token}`;
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

    // Room endpoints
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
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
