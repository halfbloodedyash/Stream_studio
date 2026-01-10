import { create } from "zustand";

export interface BrandingState {
    // Basic Branding
    primaryColor: string;
    fontFamily: string;
    
    // Logo Settings
    logo: {
        url: string;
        position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
        size: number;
        visible: boolean;
    };
    
    // Background Settings
    background: {
        url: string;
        visible: boolean;
    };
    
    // Video Clips (Intros/Outros)
    clips: Clip[];
    activeClipId: string | null;
    
    // Actions
    setPrimaryColor: (color: string) => void;
    setFontFamily: (font: string) => void;
    setLogo: (updates: Partial<BrandingState["logo"]>) => void;
    setBackground: (updates: Partial<BrandingState["background"]>) => void;
    addClip: (clip: Clip) => void;
    removeClip: (clipId: string) => void;
    setActiveClip: (clipId: string | null) => void;
}

export interface Clip {
    id: string;
    name: string;
    url: string;
    type: "intro" | "outro" | "clip";
    duration?: number;
}

export const useBrandingStore = create<BrandingState>((set) => ({
    primaryColor: "#2dd4bf",
    fontFamily: "Inter",
    logo: {
        url: "",
        position: "top-right",
        size: 10,
        visible: true,
    },
    background: {
        url: "",
        visible: true,
    },
    clips: [],
    activeClipId: null,

    setPrimaryColor: (primaryColor) => set({ primaryColor }),
    setFontFamily: (fontFamily) => set({ fontFamily }),
    setLogo: (updates) => set((state) => ({ logo: { ...state.logo, ...updates } })),
    setBackground: (updates) => set((state) => ({ background: { ...state.background, ...updates } })),
    addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
    removeClip: (clipId) => set((state) => ({ clips: state.clips.filter((c) => c.id !== clipId) })),
    setActiveClip: (activeClipId) => set({ activeClipId }),
}));
