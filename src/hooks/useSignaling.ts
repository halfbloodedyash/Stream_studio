"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface WaitingGuest {
    clientId: string;
    name: string;
}

export interface SignalingState {
    isConnected: boolean;
    clientId: string | null;
    waitingGuests: WaitingGuest[];
    isAdmitted: boolean;
    isWaiting: boolean;
    error: string | null;
}

interface UseSignalingOptions {
    roomId: string;
    userName: string;
    isHost: boolean;
    onAdmitted?: () => void;
    onRemoved?: (reason: string) => void;
}

export function useSignaling({
    roomId,
    userName,
    isHost,
    onAdmitted,
    onRemoved,
}: UseSignalingOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [state, setState] = useState<SignalingState>({
        isConnected: false,
        clientId: null,
        waitingGuests: [],
        isAdmitted: false,
        isWaiting: false,
        error: null,
    });

    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:4001";

    const sendMessage = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(signalingUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("🔗 Connected to signaling server");
                setState(prev => ({ ...prev, isConnected: true, error: null }));

                // Join or create room based on role
                if (isHost) {
                    ws.send(JSON.stringify({
                        type: "create-room",
                        payload: { roomId, userId: "host", name: userName }
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: "join-room",
                        payload: { roomId, name: userName }
                    }));
                    setState(prev => ({ ...prev, isWaiting: true }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleMessage(message);
                } catch (err) {
                    console.error("Failed to parse signaling message:", err);
                }
            };

            ws.onclose = () => {
                console.log("🔌 Disconnected from signaling server");
                setState(prev => ({ ...prev, isConnected: false }));

                // Attempt reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                setState(prev => ({ ...prev, error: "Connection failed" }));
            };

        } catch (err) {
            console.error("Failed to connect to signaling server:", err);
            setState(prev => ({ ...prev, error: "Failed to connect" }));
        }
    }, [signalingUrl, roomId, userName, isHost]);

    const handleMessage = useCallback((message: { type: string; payload?: any }) => {
        console.log("📩 Signaling message:", message.type, message.payload);

        switch (message.type) {
            case "connected":
                setState(prev => ({ ...prev, clientId: message.payload?.clientId }));
                break;

            case "room-created":
                console.log("Room created:", message.payload?.roomId);
                break;

            case "waiting-room":
                console.log("In waiting room for:", message.payload?.roomId);
                setState(prev => ({ ...prev, isWaiting: true }));
                break;

            case "guest-waiting":
                // Host receives this when a guest wants to join
                setState(prev => ({
                    ...prev,
                    waitingGuests: [
                        ...prev.waitingGuests.filter(g => g.clientId !== message.payload.clientId),
                        { clientId: message.payload.clientId, name: message.payload.name }
                    ]
                }));
                break;

            case "admitted":
                // Guest receives this when host admits them
                setState(prev => ({ ...prev, isAdmitted: true, isWaiting: false }));
                onAdmitted?.();
                break;

            case "removed":
                // Guest receives this when removed by host
                setState(prev => ({ ...prev, isAdmitted: false, isWaiting: false }));
                onRemoved?.(message.payload?.reason || "Removed by host");
                break;

            case "participant-joined":
                console.log("Participant joined:", message.payload);
                break;

            case "participant-left":
                // Remove from waiting guests if they disconnect
                setState(prev => ({
                    ...prev,
                    waitingGuests: prev.waitingGuests.filter(
                        g => g.clientId !== message.payload?.clientId
                    )
                }));
                break;

            case "pong":
                // Keep-alive response
                break;

            case "error":
                console.error("Signaling error:", message.payload?.message);
                setState(prev => ({ ...prev, error: message.payload?.message }));
                break;
        }
    }, [onAdmitted, onRemoved]);

    const admitGuest = useCallback((guestId: string) => {
        sendMessage({
            type: "admit-guest",
            payload: { guestId }
        });
        // Remove from waiting list
        setState(prev => ({
            ...prev,
            waitingGuests: prev.waitingGuests.filter(g => g.clientId !== guestId)
        }));
    }, [sendMessage]);

    const removeGuest = useCallback((guestId: string) => {
        sendMessage({
            type: "remove-guest",
            payload: { guestId }
        });
        // Remove from waiting list
        setState(prev => ({
            ...prev,
            waitingGuests: prev.waitingGuests.filter(g => g.clientId !== guestId)
        }));
    }, [sendMessage]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    // Connect on mount
    useEffect(() => {
        if (roomId && userName) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [roomId, userName, connect, disconnect]);

    // Ping to keep connection alive
    useEffect(() => {
        if (!state.isConnected) return;

        const pingInterval = setInterval(() => {
            sendMessage({ type: "ping" });
        }, 30000);

        return () => clearInterval(pingInterval);
    }, [state.isConnected, sendMessage]);

    return {
        ...state,
        admitGuest,
        removeGuest,
        disconnect,
    };
}
