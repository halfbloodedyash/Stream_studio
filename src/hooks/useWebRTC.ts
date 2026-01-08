"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface RTCConfig {
    iceServers: RTCIceServer[];
}

interface PeerConnection {
    id: string;
    connection: RTCPeerConnection;
    stream?: MediaStream;
    dataChannel?: RTCDataChannel;
}

interface SignalingMessage {
    type: string;
    payload?: any;
    from?: string;
    to?: string;
}

interface UseWebRTCOptions {
    roomId: string;
    userId: string;
    userName: string;
    isHost: boolean;
    signalingUrl: string;
    localStream: MediaStream | null;
    onRemoteStream?: (peerId: string, stream: MediaStream) => void;
    onPeerDisconnect?: (peerId: string) => void;
    onDataMessage?: (peerId: string, data: any) => void;
    onGuestWaiting?: (guest: { clientId: string; name: string }) => void;
    onChatMessage?: (message: { clientId: string; name: string; message: string; timestamp: string }) => void;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
];

export function useWebRTC({
    roomId,
    userId,
    userName,
    isHost,
    signalingUrl,
    localStream,
    onRemoteStream,
    onPeerDisconnect,
    onDataMessage,
    onGuestWaiting,
    onChatMessage,
}: UseWebRTCOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const peersRef = useRef<Map<string, PeerConnection>>(new Map());
    const clientIdRef = useRef<string | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Array<{ clientId: string; name: string; isHost: boolean }>>([]);
    const [waitingGuests, setWaitingGuests] = useState<Array<{ clientId: string; name: string }>>([]);

    const rtcConfig: RTCConfig = {
        iceServers: DEFAULT_ICE_SERVERS,
    };

    // Send message through WebSocket
    const sendSignalingMessage = useCallback((message: SignalingMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(rtcConfig);

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignalingMessage({
                    type: "ice-candidate",
                    to: peerId,
                    payload: { candidate: event.candidate },
                });
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                handlePeerDisconnect(peerId);
            }
        };

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log(`Received track from ${peerId}`, event.streams);
            if (event.streams[0]) {
                const peer = peersRef.current.get(peerId);
                if (peer) {
                    peer.stream = event.streams[0];
                }
                onRemoteStream?.(peerId, event.streams[0]);
            }
        };

        // Create data channel (for direct messaging)
        const dataChannel = pc.createDataChannel("data", { ordered: true });
        dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onDataMessage?.(peerId, data);
            } catch (e) {
                console.error("Failed to parse data channel message:", e);
            }
        };

        // Handle incoming data channel
        pc.ondatachannel = (event) => {
            const peer = peersRef.current.get(peerId);
            if (peer) {
                peer.dataChannel = event.channel;
                event.channel.onmessage = (messageEvent) => {
                    try {
                        const data = JSON.parse(messageEvent.data);
                        onDataMessage?.(peerId, data);
                    } catch (e) {
                        console.error("Failed to parse data channel message:", e);
                    }
                };
            }
        };

        peersRef.current.set(peerId, { id: peerId, connection: pc, dataChannel });
        return pc;
    }, [localStream, onRemoteStream, onDataMessage, sendSignalingMessage]);

    // Handle peer disconnect
    const handlePeerDisconnect = useCallback((peerId: string) => {
        const peer = peersRef.current.get(peerId);
        if (peer) {
            peer.connection.close();
            peersRef.current.delete(peerId);
            onPeerDisconnect?.(peerId);
            setParticipants((prev) => prev.filter((p) => p.clientId !== peerId));
        }
    }, [onPeerDisconnect]);

    // Create and send offer
    const createOffer = useCallback(async (peerId: string) => {
        const pc = createPeerConnection(peerId);

        try {
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);

            sendSignalingMessage({
                type: "offer",
                to: peerId,
                payload: { sdp: offer },
            });
        } catch (error) {
            console.error("Failed to create offer:", error);
        }
    }, [createPeerConnection, sendSignalingMessage]);

    // Handle incoming offer
    const handleOffer = useCallback(async (peerId: string, offer: RTCSessionDescriptionInit) => {
        let pc = peersRef.current.get(peerId)?.connection;
        if (!pc) {
            pc = createPeerConnection(peerId);
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            sendSignalingMessage({
                type: "answer",
                to: peerId,
                payload: { sdp: answer },
            });
        } catch (error) {
            console.error("Failed to handle offer:", error);
        }
    }, [createPeerConnection, sendSignalingMessage]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (peerId: string, answer: RTCSessionDescriptionInit) => {
        const pc = peersRef.current.get(peerId)?.connection;
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error("Failed to handle answer:", error);
            }
        }
    }, []);

    // Handle ICE candidate
    const handleIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidateInit) => {
        const pc = peersRef.current.get(peerId)?.connection;
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Failed to add ICE candidate:", error);
            }
        }
    }, []);

    // Handle signaling messages
    const handleSignalingMessage = useCallback((message: SignalingMessage) => {
        switch (message.type) {
            case "connected":
                clientIdRef.current = message.payload.clientId;
                break;

            case "room-created":
            case "admitted":
                setIsConnected(true);
                if (message.payload.participants) {
                    setParticipants(message.payload.participants);
                    // Create offers to all existing participants
                    message.payload.participants.forEach((p: { clientId: string }) => {
                        createOffer(p.clientId);
                    });
                }
                break;

            case "waiting-room":
                // Guest is waiting for admission
                break;

            case "guest-waiting":
                setWaitingGuests((prev) => [...prev, message.payload]);
                onGuestWaiting?.(message.payload);
                break;

            case "participant-joined":
                setParticipants((prev) => [...prev, message.payload]);
                // If we're the host or existing participant, create offer to new participant
                if (isHost || clientIdRef.current) {
                    createOffer(message.payload.clientId);
                }
                break;

            case "participant-left":
                handlePeerDisconnect(message.payload.clientId);
                setWaitingGuests((prev) =>
                    prev.filter((g) => g.clientId !== message.payload.clientId)
                );
                break;

            case "offer":
                if (message.from) {
                    handleOffer(message.from, message.payload.sdp);
                }
                break;

            case "answer":
                if (message.from) {
                    handleAnswer(message.from, message.payload.sdp);
                }
                break;

            case "ice-candidate":
                if (message.from) {
                    handleIceCandidate(message.from, message.payload.candidate);
                }
                break;

            case "chat":
                onChatMessage?.(message.payload);
                break;

            case "removed":
                setIsConnected(false);
                setConnectionError(message.payload.reason);
                break;

            case "room-closed":
                setIsConnected(false);
                setConnectionError("Room has been closed");
                break;

            case "error":
                setConnectionError(message.payload.message);
                break;

            default:
                console.log("Unhandled signaling message:", message.type);
        }
    }, [isHost, createOffer, handleOffer, handleAnswer, handleIceCandidate, handlePeerDisconnect, onGuestWaiting, onChatMessage]);

    // Connect to signaling server
    useEffect(() => {
        if (!signalingUrl || !roomId) return;

        const ws = new WebSocket(signalingUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to signaling server");
            // Create or join room
            if (isHost) {
                sendSignalingMessage({
                    type: "create-room",
                    payload: { roomId, userId, name: userName },
                });
            } else {
                sendSignalingMessage({
                    type: "join-room",
                    payload: { roomId, name: userName },
                });
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleSignalingMessage(message);
            } catch (error) {
                console.error("Failed to parse signaling message:", error);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setConnectionError("Connection error");
        };

        ws.onclose = () => {
            console.log("Disconnected from signaling server");
            setIsConnected(false);
        };

        // Heartbeat
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            ws.close();
            wsRef.current = null;
            peersRef.current.forEach((peer) => peer.connection.close());
            peersRef.current.clear();
        };
    }, [signalingUrl, roomId, userId, userName, isHost]);

    // Update tracks when local stream changes
    useEffect(() => {
        if (!localStream) return;

        peersRef.current.forEach((peer) => {
            const senders = peer.connection.getSenders();

            localStream.getTracks().forEach((track) => {
                const sender = senders.find((s) => s.track?.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track);
                } else {
                    peer.connection.addTrack(track, localStream);
                }
            });
        });
    }, [localStream]);

    // Admit guest (host only)
    const admitGuest = useCallback((guestId: string) => {
        if (!isHost) return;
        sendSignalingMessage({
            type: "admit-guest",
            payload: { guestId },
        });
        setWaitingGuests((prev) => prev.filter((g) => g.clientId !== guestId));
    }, [isHost, sendSignalingMessage]);

    // Remove guest (host only)
    const removeGuest = useCallback((guestId: string) => {
        if (!isHost) return;
        sendSignalingMessage({
            type: "remove-guest",
            payload: { guestId },
        });
    }, [isHost, sendSignalingMessage]);

    // Send chat message
    const sendChatMessage = useCallback((message: string) => {
        sendSignalingMessage({
            type: "chat",
            payload: { message },
        });
    }, [sendSignalingMessage]);

    // Leave room
    const leaveRoom = useCallback(() => {
        sendSignalingMessage({ type: "leave-room" });
        peersRef.current.forEach((peer) => peer.connection.close());
        peersRef.current.clear();
        setIsConnected(false);
    }, [sendSignalingMessage]);

    return {
        isConnected,
        connectionError,
        participants,
        waitingGuests,
        clientId: clientIdRef.current,
        admitGuest,
        removeGuest,
        sendChatMessage,
        leaveRoom,
    };
}
