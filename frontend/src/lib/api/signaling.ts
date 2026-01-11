"use client";

import { EventEmitter } from "events";

export type SignalingMessage = {
    type: string;
    payload?: any;
    to?: string;
    from?: string;
};

class SignalingClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private url: string;
    private isConnected: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private clientId: string | null = null;

    constructor(url: string = "ws://localhost:4001") {
        super();
        // Allow overriding via env var if needed, default to local dev port
        this.url = process.env.NEXT_PUBLIC_SIGNALING_URL || url;
        console.log(`[SIGNALING] 🔧 Initialized with URL: ${this.url}`);
        console.log(`[SIGNALING] 🔧 Environment NEXT_PUBLIC_SIGNALING_URL: ${process.env.NEXT_PUBLIC_SIGNALING_URL || '(not set)'}`);
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            console.log(`[SIGNALING] ⚠️ Already connected/connecting. State: ${this.ws.readyState}`);
            return;
        }

        console.log(`[SIGNALING] 🔌 Attempting connection to: ${this.url}`);

        try {
            this.ws = new WebSocket(this.url);
            console.log(`[SIGNALING] 🔌 WebSocket created, waiting for open...`);

            this.ws.onopen = () => {
                console.log(`[SIGNALING] ✅ Connected successfully!`);
                this.isConnected = true;
                this.emit("connect");

                // Clear reconnect timer on successful connection
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: SignalingMessage = JSON.parse(event.data);
                    console.log(`[SIGNALING] 📨 Received: ${message.type}`, message.payload || '');

                    // Handle internal system messages
                    if (message.type === "connected") {
                        this.clientId = message.payload.clientId;
                        console.log(`[SIGNALING] 🆔 Assigned Client ID: ${this.clientId}`);
                    }

                    this.emit("message", message);
                    // Also emit the specific message type for easier listening
                    this.emit(message.type, message.payload);
                } catch (e) {
                    console.error("[SIGNALING] ❌ Failed to parse message:", e, event.data);
                }
            };

            this.ws.onclose = (event) => {
                console.log(`[SIGNALING] 🔴 Disconnected. Code: ${event.code}, Reason: ${event.reason || 'none'}`);
                this.isConnected = false;
                this.emit("disconnect");
                this.ws = null;

                // Attempt reconnect after 3 seconds
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error("[SIGNALING] ❌ WebSocket Error:", error);
                console.error(`[SIGNALING] ❌ Connection to ${this.url} failed. Check if signaling server is running.`);
                this.emit("error", error);
            };

        } catch (e) {
            console.error("[SIGNALING] ❌ Failed to create WebSocket connection:", e);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (!this.reconnectTimer) {
            console.log(`[SIGNALING] 🔄 Scheduling reconnect in 3 seconds...`);
            this.reconnectTimer = setTimeout(() => {
                console.log("[SIGNALING] 🔄 Attempting reconnect...");
                this.connect();
            }, 3000);
        }
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(type: string, payload: any = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn(`[SIGNALING] ⚠️ Cannot send "${type}" - WebSocket not connected. State: ${this.ws?.readyState ?? 'null'}`);
            return;
        }

        const message: SignalingMessage = { type, payload };
        console.log(`[SIGNALING] 📤 Sending: ${type}`, payload);
        this.ws.send(JSON.stringify(message));
    }

    getClientId() {
        return this.clientId;
    }

    getConnectionState(): string {
        if (!this.ws) return 'NOT_CREATED';
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }

    isConnectedNow(): boolean {
        return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
export const signalingClient = new SignalingClient();
export default signalingClient;
