"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
    VideoCompositor,
    VideoSource,
    Overlay,
    LayoutType,
    LAYOUTS,
} from "@/lib/canvas/VideoCompositor";

interface UseCanvasCompositorOptions {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    width?: number;
    height?: number;
    backgroundColor?: string;
    onOutputStreamReady?: (stream: MediaStream) => void;
}

export function useCanvasCompositor({
    canvasRef,
    width = 1920,
    height = 1080,
    backgroundColor = "#1a1a2e",
    onOutputStreamReady,
}: UseCanvasCompositorOptions) {
    const compositorRef = useRef<VideoCompositor | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [currentLayout, setCurrentLayout] = useState<LayoutType>("solo");
    const [sourceCount, setSourceCount] = useState(0);

    // Initialize compositor
    useEffect(() => {
        if (!canvasRef.current) return;

        const compositor = new VideoCompositor(canvasRef.current);
        compositor.setResolution(width, height);
        // Note: backgroundColor is set during construction or via CSS
        compositorRef.current = compositor;

        return () => {
            compositor.destroy();
            compositorRef.current = null;
        };
    }, [canvasRef, width, height, backgroundColor]);

    // Start compositor
    const start = useCallback(() => {
        if (compositorRef.current && !isRunning) {
            compositorRef.current.start();
            setIsRunning(true);

            // Get output stream
            const outputStream = compositorRef.current.getOutputStream(30);
            onOutputStreamReady?.(outputStream);
        }
    }, [isRunning, onOutputStreamReady]);

    // Stop compositor
    const stop = useCallback(() => {
        if (compositorRef.current && isRunning) {
            compositorRef.current.stop();
            setIsRunning(false);
        }
    }, [isRunning]);

    // Add video source
    const addSource = useCallback((source: VideoSource) => {
        if (compositorRef.current) {
            compositorRef.current.addSource(source);
            setSourceCount((prev) => prev + 1);
        }
    }, []);

    // Remove video source
    const removeSource = useCallback((id: string) => {
        if (compositorRef.current) {
            compositorRef.current.removeSource(id);
            setSourceCount((prev) => Math.max(0, prev - 1));
        }
    }, []);

    // Update source stream
    const updateSourceStream = useCallback((id: string, stream: MediaStream) => {
        if (compositorRef.current) {
            compositorRef.current.updateSourceStream(id, stream);
        }
    }, []);

    // Set layout
    const setLayout = useCallback((layout: LayoutType, animate: boolean = true) => {
        if (compositorRef.current) {
            compositorRef.current.setLayout(layout, animate);
            setCurrentLayout(layout);
        }
    }, []);

    // Add overlay
    const addOverlay = useCallback((overlay: Overlay) => {
        if (compositorRef.current) {
            compositorRef.current.addOverlay(overlay);
        }
    }, []);

    // Remove overlay
    const removeOverlay = useCallback((id: string) => {
        if (compositorRef.current) {
            compositorRef.current.removeOverlay(id);
        }
    }, []);

    // Toggle overlay visibility
    const setOverlayVisible = useCallback((id: string, visible: boolean) => {
        if (compositorRef.current) {
            compositorRef.current.setOverlayVisible(id, visible);
        }
    }, []);

    // Set resolution
    const setResolution = useCallback((newWidth: number, newHeight: number) => {
        if (compositorRef.current) {
            compositorRef.current.setResolution(newWidth, newHeight);
        }
    }, []);

    // Get available layouts
    const getAvailableLayouts = useCallback(() => {
        return Object.entries(LAYOUTS).map(([key, config]) => ({
            type: key as LayoutType,
            name: config.name,
            maxSources: config.maxSources,
        }));
    }, []);

    // Get output stream
    const getOutputStream = useCallback((frameRate: number = 30) => {
        return compositorRef.current?.getOutputStream(frameRate);
    }, []);

    return {
        isRunning,
        currentLayout,
        sourceCount,
        start,
        stop,
        addSource,
        removeSource,
        updateSourceStream,
        setLayout,
        addOverlay,
        removeOverlay,
        setOverlayVisible,
        setResolution,
        getAvailableLayouts,
        getOutputStream,
    };
}
