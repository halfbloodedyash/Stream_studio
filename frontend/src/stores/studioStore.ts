import { create } from "zustand";
import { LayoutType } from "@/lib/types/layouts";

interface StudioState {
    // Stream state
    isLive: boolean;
    isRecording: boolean;
    streamTime: number;

    // Scene state
    activeSceneId: string;
    scenes: Scene[];
    isEditMode: boolean;

    // UI state
    activeSidebarTab: "scenes" | "guests" | "comments";
    activeRightPanelTab: "comments" | "destinations";

    // Actions
    setIsLive: (isLive: boolean) => void;
    setIsRecording: (isRecording: boolean) => void;
    incrementStreamTime: () => void;
    resetStreamTime: () => void;
    setActiveScene: (sceneId: string) => void;
    addScene: (scene: Scene) => void;
    removeScene: (sceneId: string) => void;
    updateScene: (sceneId: string, updates: Partial<Scene>) => void;
    updateSceneSources: (sceneId: string, sources: Source[]) => void;
    setEditMode: (isEditMode: boolean) => void;
    setSidebarTab: (tab: "scenes" | "guests" | "comments") => void;
    setRightPanelTab: (tab: "comments" | "destinations") => void;
}

export interface Scene {
    id: string;
    name: string;
    layout: LayoutType;
    sources: Source[];
}

export interface Source {
    id: string;
    type: "camera" | "screen" | "image" | "video";
    position: { x: number; y: number; width: number; height: number };
}

export const useStudioStore = create<StudioState>((set) => ({
    // Initial state
    isLive: false,
    isRecording: false,
    streamTime: 0,
    activeSceneId: "scene-1",
    scenes: [
        {
            id: "scene-1",
            name: "Main Scene",
            layout: "solo",
            sources: [],
        },
        {
            id: "scene-2",
            name: "Screen Share",
            layout: "pip",
            sources: [],
        },
    ],
    activeSidebarTab: "scenes",
    activeRightPanelTab: "comments",
    isEditMode: false,

    // Actions
    setIsLive: (isLive) =>
        set((state) => ({
            isLive,
            streamTime: isLive ? 0 : state.streamTime,
        })),

    setIsRecording: (isRecording) => set({ isRecording }),

    incrementStreamTime: () =>
        set((state) => ({ streamTime: state.streamTime + 1 })),

    resetStreamTime: () => set({ streamTime: 0 }),

    setActiveScene: (sceneId) => set({ activeSceneId: sceneId }),

    addScene: (scene) =>
        set((state) => ({
            scenes: [...state.scenes, scene],
        })),

    removeScene: (sceneId) =>
        set((state) => ({
            scenes: state.scenes.filter((s) => s.id !== sceneId),
            activeSceneId:
                state.activeSceneId === sceneId
                    ? state.scenes[0]?.id || ""
                    : state.activeSceneId,
        })),

    updateScene: (sceneId, updates) =>
        set((state) => ({
            scenes: state.scenes.map((s) =>
                s.id === sceneId ? { ...s, ...updates } : s
            ),
        })),

    setSidebarTab: (tab) => set({ activeSidebarTab: tab }),

    setRightPanelTab: (tab) => set({ activeRightPanelTab: tab }),

    updateSceneSources: (sceneId, sources) =>
        set((state) => ({
            scenes: state.scenes.map((s) =>
                s.id === sceneId ? { ...s, sources } : s
            ),
        })),

    setEditMode: (isEditMode) => set({ isEditMode }),
}));
