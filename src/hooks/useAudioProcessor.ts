"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AudioProcessor, AudioSource, AudioLevels } from "@/lib/audio/AudioProcessor";

interface UseAudioProcessorOptions {
    onLevelUpdate?: (sourceId: string, levels: AudioLevels) => void;
    onMasterLevelUpdate?: (levels: AudioLevels) => void;
}

export function useAudioProcessor({
    onLevelUpdate,
    onMasterLevelUpdate,
}: UseAudioProcessorOptions = {}) {
    const processorRef = useRef<AudioProcessor | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [sources, setSources] = useState<Map<string, AudioSource>>(new Map());
    const [masterVolume, setMasterVolumeState] = useState(1);
    const [masterLevels, setMasterLevels] = useState<AudioLevels>({ peak: 0, rms: 0, clipping: false });

    // Initialize processor
    useEffect(() => {
        const processor = new AudioProcessor();
        processorRef.current = processor;

        return () => {
            processor.destroy();
            processorRef.current = null;
        };
    }, []);

    // Update master levels periodically
    useEffect(() => {
        if (!isRunning || !processorRef.current) return;

        const interval = setInterval(() => {
            if (processorRef.current) {
                const levels = processorRef.current.getMasterLevels();
                setMasterLevels(levels);
                onMasterLevelUpdate?.(levels);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [isRunning, onMasterLevelUpdate]);

    // Start audio processing
    const start = useCallback(async () => {
        if (processorRef.current && !isRunning) {
            await processorRef.current.start();
            setIsRunning(true);
        }
    }, [isRunning]);

    // Stop audio processing
    const stop = useCallback(() => {
        if (processorRef.current && isRunning) {
            processorRef.current.stop();
            setIsRunning(false);
        }
    }, [isRunning]);

    // Add audio source
    const addSource = useCallback((source: AudioSource) => {
        if (processorRef.current) {
            processorRef.current.addSource(source);
            setSources((prev) => new Map(prev).set(source.id, source));

            // Register level callback
            if (onLevelUpdate) {
                processorRef.current.onLevelUpdate(source.id, (levels) => {
                    onLevelUpdate(source.id, levels);
                });
            }
        }
    }, [onLevelUpdate]);

    // Remove audio source
    const removeSource = useCallback((id: string) => {
        if (processorRef.current) {
            processorRef.current.removeSource(id);
            setSources((prev) => {
                const newSources = new Map(prev);
                newSources.delete(id);
                return newSources;
            });
        }
    }, []);

    // Set source volume
    const setVolume = useCallback((id: string, volume: number) => {
        if (processorRef.current) {
            processorRef.current.setVolume(id, volume);
            setSources((prev) => {
                const newSources = new Map(prev);
                const source = newSources.get(id);
                if (source) {
                    source.volume = volume;
                }
                return newSources;
            });
        }
    }, []);

    // Set source muted
    const setMuted = useCallback((id: string, muted: boolean) => {
        if (processorRef.current) {
            processorRef.current.setMuted(id, muted);
            setSources((prev) => {
                const newSources = new Map(prev);
                const source = newSources.get(id);
                if (source) {
                    source.muted = muted;
                }
                return newSources;
            });
        }
    }, []);

    // Set source pan
    const setPan = useCallback((id: string, pan: number) => {
        if (processorRef.current) {
            processorRef.current.setPan(id, pan);
            setSources((prev) => {
                const newSources = new Map(prev);
                const source = newSources.get(id);
                if (source) {
                    source.pan = pan;
                }
                return newSources;
            });
        }
    }, []);

    // Set master volume
    const setMasterVolume = useCallback((volume: number) => {
        if (processorRef.current) {
            processorRef.current.setMasterVolume(volume);
            setMasterVolumeState(volume);
        }
    }, []);

    // Get source levels
    const getSourceLevels = useCallback((id: string): AudioLevels => {
        if (processorRef.current) {
            return processorRef.current.getSourceLevels(id);
        }
        return { peak: 0, rms: 0, clipping: false };
    }, []);

    // Get output stream
    const getOutputStream = useCallback(() => {
        return processorRef.current?.getOutputStream();
    }, []);

    // Create combined stream (video + audio)
    const createCombinedStream = useCallback((videoStream: MediaStream) => {
        if (processorRef.current) {
            return processorRef.current.createCombinedStream(videoStream);
        }
        return videoStream;
    }, []);

    return {
        isRunning,
        sources: Array.from(sources.values()),
        masterVolume,
        masterLevels,
        start,
        stop,
        addSource,
        removeSource,
        setVolume,
        setMuted,
        setPan,
        setMasterVolume,
        getSourceLevels,
        getOutputStream,
        createCombinedStream,
    };
}
