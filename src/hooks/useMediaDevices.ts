"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface MediaDevicesState {
    localStream: MediaStream | null;
    screenStream: MediaStream | null;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
    selectedAudioDevice: string;
    selectedVideoDevice: string;
    error: string | null;
}

export function useMediaDevices() {
    const [state, setState] = useState<MediaDevicesState>({
        localStream: null,
        screenStream: null,
        isAudioEnabled: true,
        isVideoEnabled: true,
        isScreenSharing: false,
        audioDevices: [],
        videoDevices: [],
        selectedAudioDevice: "",
        selectedVideoDevice: "",
        error: null,
    });

    const streamRef = useRef<MediaStream | null>(null);

    // Enumerate available devices
    const enumerateDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter((d) => d.kind === "audioinput");
            const videoDevices = devices.filter((d) => d.kind === "videoinput");

            setState((prev) => ({
                ...prev,
                audioDevices,
                videoDevices,
                selectedAudioDevice:
                    prev.selectedAudioDevice || audioDevices[0]?.deviceId || "",
                selectedVideoDevice:
                    prev.selectedVideoDevice || videoDevices[0]?.deviceId || "",
            }));
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    }, []);

    // Initialize media stream
    const initializeMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                },
            });

            streamRef.current = stream;

            setState((prev) => ({
                ...prev,
                localStream: stream,
                isAudioEnabled: true,
                isVideoEnabled: true,
                error: null,
            }));

            // Enumerate devices after getting permission
            await enumerateDevices();
        } catch (err: any) {
            console.error("Error accessing media devices:", err);
            setState((prev) => ({
                ...prev,
                error: err.message || "Could not access camera/microphone",
            }));
        }
    }, [enumerateDevices]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            audioTracks.forEach((track) => {
                track.enabled = !track.enabled;
            });
            setState((prev) => ({
                ...prev,
                isAudioEnabled: !prev.isAudioEnabled,
            }));
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (streamRef.current) {
            const videoTracks = streamRef.current.getVideoTracks();
            videoTracks.forEach((track) => {
                track.enabled = !track.enabled;
            });
            setState((prev) => ({
                ...prev,
                isVideoEnabled: !prev.isVideoEnabled,
            }));
        }
    }, []);

    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "monitor",
                },
                audio: true,
            });

            // Handle when user stops sharing via browser UI
            stream.getVideoTracks()[0].onended = () => {
                setState((prev) => ({
                    ...prev,
                    screenStream: null,
                    isScreenSharing: false,
                }));
            };

            setState((prev) => ({
                ...prev,
                screenStream: stream,
                isScreenSharing: true,
            }));

            return stream;
        } catch (err: any) {
            console.error("Error starting screen share:", err);
            setState((prev) => ({
                ...prev,
                error: err.message || "Could not share screen",
            }));
            return null;
        }
    }, []);

    // Stop screen sharing
    const stopScreenShare = useCallback(() => {
        setState((prev) => {
            if (prev.screenStream) {
                prev.screenStream.getTracks().forEach((track) => track.stop());
            }
            return {
                ...prev,
                screenStream: null,
                isScreenSharing: false,
            };
        });
    }, []);

    // Switch audio device
    const switchAudioDevice = useCallback(
        async (deviceId: string) => {
            if (!streamRef.current) return;

            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: { exact: deviceId },
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                    video: false,
                });

                // Replace audio track
                const oldAudioTrack = streamRef.current.getAudioTracks()[0];
                const newAudioTrack = newStream.getAudioTracks()[0];

                if (oldAudioTrack) {
                    streamRef.current.removeTrack(oldAudioTrack);
                    oldAudioTrack.stop();
                }
                streamRef.current.addTrack(newAudioTrack);

                setState((prev) => ({
                    ...prev,
                    selectedAudioDevice: deviceId,
                    localStream: streamRef.current,
                }));
            } catch (err) {
                console.error("Error switching audio device:", err);
            }
        },
        []
    );

    // Switch video device
    const switchVideoDevice = useCallback(
        async (deviceId: string) => {
            if (!streamRef.current) return;

            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        deviceId: { exact: deviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });

                // Replace video track
                const oldVideoTrack = streamRef.current.getVideoTracks()[0];
                const newVideoTrack = newStream.getVideoTracks()[0];

                if (oldVideoTrack) {
                    streamRef.current.removeTrack(oldVideoTrack);
                    oldVideoTrack.stop();
                }
                streamRef.current.addTrack(newVideoTrack);

                setState((prev) => ({
                    ...prev,
                    selectedVideoDevice: deviceId,
                    localStream: streamRef.current,
                }));
            } catch (err) {
                console.error("Error switching video device:", err);
            }
        },
        []
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return {
        ...state,
        initializeMedia,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        switchAudioDevice,
        switchVideoDevice,
        enumerateDevices,
    };
}
