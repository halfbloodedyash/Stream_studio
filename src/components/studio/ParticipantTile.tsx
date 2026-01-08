"use client";

import { useRef, useEffect, useState } from "react";
import { MicOff, VideoOff, User } from "lucide-react";
import styles from "@/app/studio/studio.module.css";

interface ParticipantTileProps {
    name: string;
    stream: MediaStream | null;
    isLocal?: boolean;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isSpeaking?: boolean;
}

export function ParticipantTile({
    name,
    stream,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    isSpeaking = false,
}: ParticipantTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && stream && !isVideoOff) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isVideoOff]);

    // Audio level analyzer
    useEffect(() => {
        if (!stream || isMuted) {
            setAudioLevel(0);
            return;
        }

        // Check if stream has audio tracks before creating analyzer
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            setAudioLevel(0);
            return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(Math.min(100, average * 1.5));
        };

        const interval = setInterval(updateLevel, 50);

        return () => {
            clearInterval(interval);
            audioContext.close();
        };
    }, [stream, isMuted]);

    const getInitial = () => {
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className={`${styles.participantTile} ${isSpeaking ? styles.speaking : ""}`}>
            {/* Video */}
            {!isVideoOff && stream ? (
                <video
                    ref={videoRef}
                    className={`${styles.participantVideo} ${isLocal ? styles.mirrored : ""}`}
                    autoPlay
                    playsInline
                    muted={isLocal}
                />
            ) : (
                <div className={styles.participantPlaceholder}>
                    <div className={styles.participantAvatar}>{getInitial()}</div>
                    <span>{isVideoOff ? "Camera Off" : "No Video"}</span>
                </div>
            )}

            {/* Audio Level Indicator */}
            {!isMuted && (
                <div className={styles.audioLevel}>
                    <div
                        className={styles.audioLevelBar}
                        style={{ height: `${audioLevel}%` }}
                    />
                </div>
            )}

            {/* Info Overlay */}
            <div className={styles.participantInfo}>
                <span className={styles.participantName}>
                    {name}
                    {isMuted && <MicOff size={14} className={styles.mutedIcon} />}
                </span>
                <div className={styles.participantControls}>
                    {isVideoOff && <VideoOff size={14} />}
                </div>
            </div>
        </div>
    );
}
