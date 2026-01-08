import { useState } from "react";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    Radio,
    Circle,
    Settings,
    MoreVertical,
    MonitorUp,
    Wifi,
    RotateCcw,
} from "lucide-react";
import styles from "@/app/studio/studio.module.css";

interface ControlBarProps {
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isLive: boolean;
    isRecording: boolean;
    isScreenSharing?: boolean;
    recordingDuration?: string;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onGoLive: () => void;
    onToggleRecording: () => void;
    onToggleScreenShare?: () => void;
    onOpenDestinations?: () => void;
    onOpenSettings?: () => void;
    onOpenMore?: () => void;
}

export function ControlBar({
    isAudioEnabled,
    isVideoEnabled,
    isLive,
    isRecording,
    isScreenSharing = false,
    recordingDuration = "0:00",
    onToggleAudio,
    onToggleVideo,
    onGoLive,
    onToggleRecording,
    onToggleScreenShare,
    onOpenDestinations,
    onOpenSettings,
    onOpenMore,
}: ControlBarProps) {
    const [showMore, setShowMore] = useState(false);

    return (
        <div className={styles.controlBar}>
            {/* Main Controls */}
            <div className={styles.controlGroup}>
                {/* Microphone */}
                <button
                    className={`${styles.iconBtn} ${!isAudioEnabled ? styles.muted : ""}`}
                    onClick={onToggleAudio}
                    title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                    {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                {/* Camera */}
                <button
                    className={`${styles.iconBtn} ${!isVideoEnabled ? styles.muted : ""}`}
                    onClick={onToggleVideo}
                    title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                    {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                {/* Screen Share */}
                <button
                    className={`${styles.iconBtn} ${isScreenSharing ? styles.active : ""}`}
                    onClick={onToggleScreenShare}
                    title="Share screen"
                >
                    <MonitorUp size={20} />
                </button>
            </div>

            <div className={styles.controlSeparator} />

            {/* Recording */}
            <div className={styles.controlGroup}>
                <button
                    className={`${styles.iconBtn} ${isRecording ? styles.danger : ""}`}
                    onClick={onToggleRecording}
                    title={isRecording ? "Stop recording" : "Start recording"}
                >
                    <Circle
                        size={20}
                        fill={isRecording ? "currentColor" : "none"}
                        style={{ color: isRecording ? "var(--color-error)" : undefined }}
                    />
                </button>
                {isRecording && (
                    <span className={styles.recordingDuration}>{recordingDuration}</span>
                )}
            </div>

            <div className={styles.controlSeparator} />

            {/* Go Live Button */}
            <button
                className={`${styles.goLiveBtn} ${isLive ? styles.live : ""} ${isLive ? styles.endBtn : ""
                    }`}
                onClick={onGoLive}
            >
                <Radio size={18} />
                {isLive ? "End Stream" : "Go Live"}
            </button>

            <div className={styles.controlSeparator} />

            {/* Destinations & Settings */}
            <div className={styles.controlGroup}>
                <button
                    className={styles.iconBtn}
                    title="Stream Destinations"
                    onClick={onOpenDestinations}
                >
                    <Wifi size={20} />
                </button>
                <button
                    className={styles.iconBtn}
                    title="Settings"
                    onClick={onOpenSettings}
                >
                    <Settings size={20} />
                </button>
                {/* Relative container for the dropdown */}
                <div style={{ position: "relative" }}>
                    <button
                        className={`${styles.iconBtn} ${showMore ? styles.active : ""}`}
                        title="More options"
                        onClick={() => setShowMore(!showMore)}
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showMore && (
                        <div className={styles.moreMenu} onClick={() => setShowMore(false)}>
                            <button className={styles.menuItem}>
                                <Settings size={14} />
                                <span>Advanced Settings</span>
                            </button>
                            <button className={styles.menuItem}>
                                <RotateCcw size={14} />
                                <span>Reset Layout</span>
                            </button>
                            <div className={styles.menuSeparator} />
                            <button className={styles.menuItem} style={{ color: "var(--color-error)" }}>
                                <span>Disconnect</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
