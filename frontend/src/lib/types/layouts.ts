/**
 * Layout types for scene management
 * (Simplified from the old VideoCompositor)
 */

export type LayoutType = "solo" | "duo" | "quad" | "grid" | "pip" | "presentation";

export const LAYOUTS: Record<LayoutType, { name: string; maxSlots: number }> = {
    solo: { name: "Solo", maxSlots: 1 },
    duo: { name: "Duo", maxSlots: 2 },
    quad: { name: "Quad", maxSlots: 4 },
    grid: { name: "Grid", maxSlots: 6 },
    pip: { name: "Picture-in-Picture", maxSlots: 2 },
    presentation: { name: "Presentation", maxSlots: 2 },
};
