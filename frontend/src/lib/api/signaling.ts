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
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log(`Connecting to signaling server at ${this.url}`);

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log("Signaling connected");
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

                    // Handle internal system messages
                    if (message.type === "connected") {
                        this.clientId = message.payload.clientId;
                    }

                    this.emit("message", message);
                    // Also emit the specific message type for easier listening
                    this.emit(message.type, message.payload);
                } catch (e) {
                    console.error("Failed to parse signaling message", e);
                }
            };

            this.ws.onclose = () => {
                console.log("Signaling disconnected");
                this.isConnected = false;
                this.emit("disconnect");
                this.ws = null;

                // Attempt reconnect after 3 seconds
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error("Signaling error:", error);
                this.emit("error", error);
            };

        } catch (e) {
            console.error("Failed to create WebSocket connection", e);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
                console.log("Attempting reconnect...");
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
            console.warn("WebSocket not connected, cannot send message", type);
            return;
        }

        const message: SignalingMessage = { type, payload };
        this.ws.send(JSON.stringify(message));
    }

    getClientId() {
        return this.clientId;
    }
}

// Singleton instance
export const signalingClient = new SignalingClient();
export default signalingClient;
