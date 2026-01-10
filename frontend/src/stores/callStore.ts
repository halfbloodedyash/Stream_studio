import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
    Room,
    LocalParticipant,
    RemoteParticipant,
    LocalTrackPublication,
    RemoteTrackPublication,
    Track,
} from "livekit-client";

/**
 * Participant state representation
 */
export interface ParticipantState {
    identity: string;
    name: string;
    isMicEnabled: boolean;
    isCamEnabled: boolean;
    isScreenSharing: boolean;
    isSpeaking: boolean;
    connectionQuality: "excellent" | "good" | "poor" | "unknown";
}

/**
 * Call state store - manages real-time call state with LiveKit
 */
interface CallState {
    // Connection state
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Room info
    roomName: string | null;
    room: Room | null;

    // Local participant state
    localParticipant: ParticipantState | null;
    isMicEnabled: boolean;
    isCamEnabled: boolean;
    isScreenSharing: boolean;

    // Remote participants
    participants: Map<string, ParticipantState>;

    // Actions
    setRoom: (room: Room | null) => void;
    setConnecting: (connecting: boolean) => void;
    setConnected: (connected: boolean) => void;
    setConnectionError: (error: string | null) => void;

    // Local media controls
    setMicEnabled: (enabled: boolean) => void;
    setCamEnabled: (enabled: boolean) => void;
    setScreenSharing: (sharing: boolean) => void;

    // Participant management
    addParticipant: (participant: ParticipantState) => void;
    updateParticipant: (identity: string, updates: Partial<ParticipantState>) => void;
    removeParticipant: (identity: string) => void;

    // Reset state
    reset: () => void;
}

const initialState = {
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    roomName: null,
    room: null,
    localParticipant: null,
    isMicEnabled: true,
    isCamEnabled: true,
    isScreenSharing: false,
    participants: new Map<string, ParticipantState>(),
};

/**
 * Zustand store for call state management
 * Uses subscribeWithSelector for efficient re-renders
 */
export const useCallStore = create<CallState>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        setRoom: (room) => set({
            room,
            roomName: room?.name || null,
            isConnected: room?.state === "connected",
        }),

        setConnecting: (isConnecting) => set({ isConnecting }),

        setConnected: (isConnected) => set({
            isConnected,
            isConnecting: false,
            connectionError: isConnected ? null : get().connectionError,
        }),

        setConnectionError: (connectionError) => set({
            connectionError,
            isConnecting: false,
        }),

        setMicEnabled: (isMicEnabled) => {
            set({ isMicEnabled });
            // Update local participant state
            const local = get().localParticipant;
            if (local) {
                set({
                    localParticipant: { ...local, isMicEnabled },
                });
            }
        },

        setCamEnabled: (isCamEnabled) => {
            set({ isCamEnabled });
            // Update local participant state
            const local = get().localParticipant;
            if (local) {
                set({
                    localParticipant: { ...local, isCamEnabled },
                });
            }
        },

        setScreenSharing: (isScreenSharing) => {
            set({ isScreenSharing });
            const local = get().localParticipant;
            if (local) {
                set({
                    localParticipant: { ...local, isScreenSharing },
                });
            }
        },

        addParticipant: (participant) => {
            const participants = new Map(get().participants);
            participants.set(participant.identity, participant);
            set({ participants });
        },

        updateParticipant: (identity, updates) => {
            const participants = new Map(get().participants);
            const existing = participants.get(identity);
            if (existing) {
                participants.set(identity, { ...existing, ...updates });
                set({ participants });
            }
        },

        removeParticipant: (identity) => {
            const participants = new Map(get().participants);
            participants.delete(identity);
            set({ participants });
        },

        reset: () => set(initialState),
    }))
);

/**
 * Helper hook to get participant count
 */
export const useParticipantCount = () => {
    return useCallStore((state) => state.participants.size + (state.isConnected ? 1 : 0));
};

/**
 * Helper hook to check if anyone is screen sharing
 */
export const useIsAnyScreenSharing = () => {
    return useCallStore((state) => {
        if (state.isScreenSharing) return true;
        for (const p of state.participants.values()) {
            if (p.isScreenSharing) return true;
        }
        return false;
    });
};
