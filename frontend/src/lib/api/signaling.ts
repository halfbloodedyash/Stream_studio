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
    private messageQueue: Array<{ type: string; payload: any }> = [];

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

        // Reset state for fresh connection
        this.clientId = null;
        this.isConnected = false;

        console.log(`[SIGNALING] 🔌 Attempting connection to: ${this.url}`);

        try {
            const ws = new WebSocket(this.url);
            this.ws = ws;
            console.log(`[SIGNALING] 🔌 WebSocket created, waiting for open...`);

            ws.onopen = () => {
                // Check if this is still the current websocket
                if (this.ws !== ws) {
                    console.log(`[SIGNALING] ⚠️ Stale WebSocket onopen, ignoring`);
                    ws.close();
                    return;
                }
                console.log(`[SIGNALING] ✅ Connected successfully!`);
                this.isConnected = true;
                this.emit("connect");

                // Clear reconnect timer on successful connection
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            ws.onmessage = (event) => {
                // Check if this is still the current websocket
                if (this.ws !== ws) return;

                try {
                    const message: SignalingMessage = JSON.parse(event.data);
                    console.log(`[SIGNALING] 📨 Received: ${message.type}`, message.payload || '');

                    // Handle internal system messages
                    if (message.type === "connected") {
                        this.clientId = message.payload.clientId;
                        console.log(`[SIGNALING] 🆔 Assigned Client ID: ${this.clientId}`);

                        // Flush message queue now that we're fully ready
                        this.flushMessageQueue();
                    }

                    this.emit("message", message);
                    // Also emit the specific message type for easier listening
                    this.emit(message.type, message.payload);
                } catch (e) {
                    console.error("[SIGNALING] ❌ Failed to parse message:", e, event.data);
                }
            };

            ws.onclose = (event) => {
                // Check if this is still the current websocket
                if (this.ws !== ws) return;

                console.log(`[SIGNALING] 🔴 Disconnected. Code: ${event.code}, Reason: ${event.reason || 'none'}`);
                this.isConnected = false;
                this.clientId = null;
                this.emit("disconnect");
                this.ws = null;

                // Attempt reconnect after 3 seconds
                this.scheduleReconnect();
            };

            ws.onerror = (error) => {
                // Check if this is still the current websocket
                if (this.ws !== ws) return;

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
                this.reconnectTimer = null;
                console.log("[SIGNALING] 🔄 Attempting reconnect...");
                this.connect();
            }, 3000);
        }
    }

    private flushMessageQueue() {
        if (this.messageQueue.length === 0) return;

        console.log(`[SIGNALING] 📬 Flushing ${this.messageQueue.length} queued messages`);
        const queue = [...this.messageQueue];
        this.messageQueue = [];

        for (const msg of queue) {
            this.send(msg.type, msg.payload);
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
        this.isConnected = false;
        this.clientId = null;
        this.messageQueue = [];
    }

    send(type: string, payload: any = {}, queue: boolean = false): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.clientId) {
            if (queue) {
                console.log(`[SIGNALING] 📥 Queueing message "${type}" - not yet ready`);
                this.messageQueue.push({ type, payload });
                return true;
            }
            console.warn(`[SIGNALING] ⚠️ Cannot send "${type}" - WebSocket not ready. State: ${this.ws?.readyState ?? 'null'}, ClientId: ${this.clientId ?? 'null'}`);
            return false;
        }

        const message: SignalingMessage = { type, payload };
        console.log(`[SIGNALING] 📤 Sending: ${type}`, payload);
        this.ws.send(JSON.stringify(message));
        return true;
    }

    /**
     * Wait for connection to be ready (WebSocket OPEN + clientId assigned)
     * Returns a promise that resolves when connected or rejects on timeout
     */
    waitForReady(timeoutMs: number = 10000): Promise<string> {
        return new Promise((resolve, reject) => {
            // Already ready
            if (this.isConnectedNow() && this.clientId) {
                resolve(this.clientId);
                return;
            }

            const startTime = Date.now();

            const checkReady = () => {
                if (this.isConnectedNow() && this.clientId) {
                    resolve(this.clientId);
                    return;
                }

                if (Date.now() - startTime > timeoutMs) {
                    reject(new Error('Connection timeout'));
                    return;
                }

                setTimeout(checkReady, 100);
            };

            checkReady();
        });
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
