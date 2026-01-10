"use client";

import { useEffect, useState } from "react";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    ControlBar,
    GridLayout,
    ParticipantTile,
    useTracks,
    useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

interface LiveKitStudioProps {
    roomName: string;
    participantName: string;
    isHost?: boolean;
    serverUrl: string;
    onDisconnected?: () => void;
}

/**
 * Fetches a LiveKit access token from the backend
 */
async function getToken(roomName: string, participantName: string, isHost: boolean = false): Promise<string> {
    const endpoint = isHost ? "/api/livekit/token" : "/api/livekit/guest-token";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(isHost ? { "Authorization": `Bearer ${localStorage.getItem("auth_token")}` } : {}),
        },
        body: JSON.stringify({ roomName, participantName, isHost }),
    });

    if (!response.ok) {
        throw new Error("Failed to get LiveKit token");
    }

    const data = await response.json();
    return data.token;
}

/**
 * LiveKit-powered video studio component
 */
export function LiveKitStudio({
    roomName,
    participantName,
    isHost = false,
    serverUrl,
    onDisconnected
}: LiveKitStudioProps) {
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getToken(roomName, participantName, isHost)
            .then(setToken)
            .catch((err) => setError(err.message));
    }, [roomName, participantName, isHost]);

    if (error) {
        return (
            <div className="livekit-error" style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--color-error)",
                gap: "16px",
            }}>
                <p>Failed to connect: {error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: "8px 16px",
                        background: "var(--color-accent-primary)",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="livekit-loading" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--color-text-muted)",
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    border: "3px solid var(--color-border-default)",
                    borderTopColor: "var(--color-accent-secondary)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                }} />
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            video={true}
            audio={true}
            onDisconnected={onDisconnected}
            style={{ height: "100%" }}
        >
            <VideoConference />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}

/**
 * Custom video grid using LiveKit tracks
 */
export function VideoGrid() {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    return (
        <GridLayout tracks={tracks} style={{ height: "100%" }}>
            <ParticipantTile />
        </GridLayout>
    );
}

/**
 * Export for use in pages
 */
export default LiveKitStudio;
