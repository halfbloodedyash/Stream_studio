"use client";

import { X, Camera, Mic, Speaker, Check, AlertCircle } from "lucide-react";
import styles from "./SettingsModal.module.css";
import { useEffect, useState } from "react";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
    selectedAudioDevice: string;
    selectedVideoDevice: string;
    onAudioDeviceChange: (deviceId: string) => void;
    onVideoDeviceChange: (deviceId: string) => void;
    localStream: MediaStream | null;
}

export function SettingsModal({
    isOpen,
    onClose,
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    onAudioDeviceChange,
    onVideoDeviceChange,
    localStream,
}: SettingsModalProps) {
    const [audioLevel, setAudioLevel] = useState(0);

    // Audio level meter for the selected microphone
    useEffect(() => {
        if (!localStream || !isOpen) return;

        let audioContext: AudioContext | null = null;
        let animationFrame: number;

        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(localStream);

            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average * 1.5);
                animationFrame = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (e) {
            console.error("Failed to start audio analyzer:", e);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            if (audioContext) audioContext.close();
        };
    }, [localStream, isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Device Settings</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Camera Selection */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <Camera size={18} />
                            <span>Camera</span>
                        </div>
                        <div className={styles.deviceList}>
                            {videoDevices.length > 0 ? (
                                videoDevices.map((device) => (
                                    <button
                                        key={device.deviceId}
                                        className={`${styles.deviceItem} ${selectedVideoDevice === device.deviceId ? styles.active : ""
                                            }`}
                                        onClick={() => onVideoDeviceChange(device.deviceId)}
                                    >
                                        <span className={styles.deviceName}>
                                            {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                                        </span>
                                        {selectedVideoDevice === device.deviceId && <Check size={16} />}
                                    </button>
                                ))
                            ) : (
                                <div className={styles.emptyDevice}>
                                    <AlertCircle size={16} />
                                    <span>No cameras found</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Microphone Selection */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <Mic size={18} />
                            <span>Microphone</span>
                        </div>
                        <div className={styles.deviceList}>
                            {audioDevices.length > 0 ? (
                                audioDevices.map((device) => (
                                    <button
                                        key={device.deviceId}
                                        className={`${styles.deviceItem} ${selectedAudioDevice === device.deviceId ? styles.active : ""
                                            }`}
                                        onClick={() => onAudioDeviceChange(device.deviceId)}
                                    >
                                        <span className={styles.deviceName}>
                                            {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                                        </span>
                                        {selectedAudioDevice === device.deviceId && <Check size={16} />}
                                    </button>
                                ))
                            ) : (
                                <div className={styles.emptyDevice}>
                                    <AlertCircle size={16} />
                                    <span>No microphones found</span>
                                </div>
                            )}
                        </div>

                        {/* Audio Level Indicator */}
                        <div className={styles.audioTest}>
                            <span className={styles.testLabel}>Mic Test</span>
                            <div className={styles.meterContainer}>
                                <div
                                    className={styles.meterFill}
                                    style={{ width: `${Math.min(100, audioLevel)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Audio Output */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <Speaker size={18} />
                            <span>Audio Output</span>
                        </div>
                        <p className={styles.note}>System default output is used for audio playback.</p>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.doneBtn} onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}
