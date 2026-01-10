import { useEffect, useCallback } from "react";
import {
    Room,
    RoomEvent,
    LocalParticipant,
    RemoteParticipant,
    Track,
    ConnectionState,
    ConnectionQuality,
} from "livekit-client";
import { useCallStore, type ParticipantState } from "@/stores/callStore";

/**
 * Convert a LiveKit participant to our store format
 */
function participantToState(
    participant: LocalParticipant | RemoteParticipant
): ParticipantState {
    const isMicEnabled = participant
        .getTrackPublications()
        .some(
            (pub) =>
                pub.track?.source === Track.Source.Microphone &&
                pub.track?.isMuted === false
        );

    const isCamEnabled = participant
        .getTrackPublications()
        .some(
            (pub) =>
                pub.track?.source === Track.Source.Camera &&
                pub.track?.isMuted === false
        );

    const isScreenSharing = participant
        .getTrackPublications()
        .some((pub) => pub.track?.source === Track.Source.ScreenShare);

    return {
        identity: participant.identity,
        name: participant.name || participant.identity,
        isMicEnabled,
        isCamEnabled,
        isScreenSharing,
        isSpeaking: participant.isSpeaking,
        connectionQuality: getConnectionQuality(participant),
    };
}

/**
 * Map LiveKit connection quality to our format
 */
function getConnectionQuality(
    participant: LocalParticipant | RemoteParticipant
): "excellent" | "good" | "poor" | "unknown" {
    const quality = participant.connectionQuality;
    switch (quality) {
        case ConnectionQuality.Excellent:
            return "excellent";
        case ConnectionQuality.Good:
            return "good";
        case ConnectionQuality.Poor:
            return "poor";
        default:
            return "unknown";
    }
}

/**
 * Hook to sync LiveKit room events with Zustand call store
 * 
 * @param room - LiveKit Room instance
 * 
 * Usage:
 * ```tsx
 * const room = useLivekitRoom({ token, serverUrl });
 * useLiveKitSync(room);
 * 
 * // Now use Zustand store
 * const { isMicEnabled, participants } = useCallStore();
 * ```
 */
export function useLiveKitSync(room: Room | null) {
    const {
        setRoom,
        setConnecting,
        setConnected,
        setConnectionError,
        setMicEnabled,
        setCamEnabled,
        setScreenSharing,
        addParticipant,
        updateParticipant,
        removeParticipant,
        reset,
    } = useCallStore();

    // Sync local participant state
    const syncLocalParticipant = useCallback(
        (localParticipant: LocalParticipant) => {
            const state = participantToState(localParticipant);
            setMicEnabled(state.isMicEnabled);
            setCamEnabled(state.isCamEnabled);
            setScreenSharing(state.isScreenSharing);
        },
        [setMicEnabled, setCamEnabled, setScreenSharing]
    );

    // Sync remote participants
    const syncRemoteParticipant = useCallback(
        (participant: RemoteParticipant) => {
            const state = participantToState(participant);
            updateParticipant(participant.identity, state);
        },
        [updateParticipant]
    );

    useEffect(() => {
        if (!room) {
            reset();
            return;
        }

        setRoom(room);

        // Connection events
        const handleConnected = () => {
            setConnected(true);
            // Sync all current participants
            room.remoteParticipants.forEach((p) => {
                addParticipant(participantToState(p));
            });
            syncLocalParticipant(room.localParticipant);
        };

        const handleDisconnected = () => {
            setConnected(false);
            reset();
        };

        const handleReconnecting = () => {
            setConnecting(true);
        };

        const handleReconnected = () => {
            setConnected(true);
        };

        // Participant events
        const handleParticipantConnected = (participant: RemoteParticipant) => {
            addParticipant(participantToState(participant));
        };

        const handleParticipantDisconnected = (participant: RemoteParticipant) => {
            removeParticipant(participant.identity);
        };

        // Track events - update participant state when tracks change
        const handleTrackMuted = (publication: any, participant: any) => {
            if (participant === room.localParticipant) {
                syncLocalParticipant(participant);
            } else {
                syncRemoteParticipant(participant);
            }
        };

        const handleTrackUnmuted = (publication: any, participant: any) => {
            if (participant === room.localParticipant) {
                syncLocalParticipant(participant);
            } else {
                syncRemoteParticipant(participant);
            }
        };

        // Speaking events
        const handleSpeakingChanged = (speaking: boolean, participant: any) => {
            if (participant !== room.localParticipant) {
                updateParticipant(participant.identity, { isSpeaking: speaking });
            }
        };

        // Subscribe to events
        room.on(RoomEvent.Connected, handleConnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);
        room.on(RoomEvent.Reconnecting, handleReconnecting);
        room.on(RoomEvent.Reconnected, handleReconnected);
        room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.TrackMuted, handleTrackMuted);
        room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            // Update speaking state for all participants
            room.remoteParticipants.forEach((p) => {
                updateParticipant(p.identity, {
                    isSpeaking: speakers.some((s) => s.identity === p.identity),
                });
            });
        });

        // Initial sync if already connected
        if (room.state === ConnectionState.Connected) {
            handleConnected();
        }

        // Cleanup
        return () => {
            room.off(RoomEvent.Connected, handleConnected);
            room.off(RoomEvent.Disconnected, handleDisconnected);
            room.off(RoomEvent.Reconnecting, handleReconnecting);
            room.off(RoomEvent.Reconnected, handleReconnected);
            room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
            room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
            room.off(RoomEvent.TrackMuted, handleTrackMuted);
            room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
        };
    }, [
        room,
        setRoom,
        setConnecting,
        setConnected,
        setConnectionError,
        addParticipant,
        updateParticipant,
        removeParticipant,
        reset,
        syncLocalParticipant,
        syncRemoteParticipant,
    ]);
}

/**
 * Hook to control local tracks via Zustand + LiveKit
 */
export function useLocalMediaControls(room: Room | null) {
    const { isMicEnabled, isCamEnabled, setMicEnabled, setCamEnabled, setScreenSharing } =
        useCallStore();

    const toggleMic = useCallback(async () => {
        if (!room) return;
        const newState = !isMicEnabled;
        await room.localParticipant.setMicrophoneEnabled(newState);
        setMicEnabled(newState);
    }, [room, isMicEnabled, setMicEnabled]);

    const toggleCam = useCallback(async () => {
        if (!room) return;
        const newState = !isCamEnabled;
        await room.localParticipant.setCameraEnabled(newState);
        setCamEnabled(newState);
    }, [room, isCamEnabled, setCamEnabled]);

    const toggleScreenShare = useCallback(async () => {
        if (!room) return;
        const tracks = room.localParticipant
            .getTrackPublications()
            .filter((p) => p.track?.source === Track.Source.ScreenShare);

        if (tracks.length > 0) {
            // Stop screen share
            await room.localParticipant.setScreenShareEnabled(false);
            setScreenSharing(false);
        } else {
            // Start screen share
            await room.localParticipant.setScreenShareEnabled(true);
            setScreenSharing(true);
        }
    }, [room, setScreenSharing]);

    return {
        isMicEnabled,
        isCamEnabled,
        toggleMic,
        toggleCam,
        toggleScreenShare,
    };
}
