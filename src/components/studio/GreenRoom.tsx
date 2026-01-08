"use client";

import { useState, useEffect, useRef } from "react";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Settings,
    RefreshCw,
    Check,
    AlertCircle,
    ChevronDown,
} from "lucide-react";

interface GreenRoomProps {
    roomId: string;
    guestName: string;
    onJoin: (stream: MediaStream) => void;
    onLeave: () => void;
    isWaiting: boolean;
    hostName?: string;
}

export function GreenRoom({
    roomId,
    guestName,
    onJoin,
    onLeave,
    isWaiting,
    hostName = "Host",
}: GreenRoomProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudio, setSelectedAudio] = useState("");
    const [selectedVideo, setSelectedVideo] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeviceSettings, setShowDeviceSettings] = useState(false);

    // Initialize media
    useEffect(() => {
        initializeMedia();
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const initializeMedia = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Enumerate devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter((d) => d.kind === "audioinput");
            const videoInputs = devices.filter((d) => d.kind === "videoinput");

            setAudioDevices(audioInputs);
            setVideoDevices(videoInputs);

            if (audioInputs.length > 0) setSelectedAudio(audioInputs[0].deviceId);
            if (videoInputs.length > 0) setSelectedVideo(videoInputs[0].deviceId);

            setError(null);
        } catch (err: any) {
            setError(err.message || "Could not access camera/microphone");
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const switchDevice = async (type: "audio" | "video", deviceId: string) => {
        if (!stream) return;

        try {
            const constraints =
                type === "audio"
                    ? { audio: { deviceId: { exact: deviceId } } }
                    : { video: { deviceId: { exact: deviceId } } };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = type === "audio"
                ? newStream.getAudioTracks()[0]
                : newStream.getVideoTracks()[0];

            const oldTrack = type === "audio"
                ? stream.getAudioTracks()[0]
                : stream.getVideoTracks()[0];

            if (oldTrack) {
                stream.removeTrack(oldTrack);
                oldTrack.stop();
            }
            stream.addTrack(newTrack);

            if (type === "audio") setSelectedAudio(deviceId);
            else setSelectedVideo(deviceId);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            setError(`Could not switch ${type} device`);
        }
    };

    const handleReady = () => {
        setIsReady(true);
        if (stream) {
            onJoin(stream);
        }
    };

    return (
        <div className="green-room">
            <style jsx>{`
        .green-room {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--color-bg-primary);
          padding: var(--space-8);
        }

        .green-room-card {
          width: 100%;
          max-width: 600px;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-6);
          text-align: center;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .room-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-1) var(--space-3);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .card-title {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--color-text-primary);
        }

        .card-subtitle {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .preview-section {
          padding: var(--space-6);
        }

        .video-preview {
          position: relative;
          aspect-ratio: 16 / 9;
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .video-preview video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .video-off-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          color: var(--color-text-muted);
        }

        .name-badge {
          position: absolute;
          bottom: var(--space-3);
          left: var(--space-3);
          padding: var(--space-1) var(--space-3);
          background: rgba(0, 0, 0, 0.7);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: white;
        }

        .controls-row {
          display: flex;
          justify-content: center;
          gap: var(--space-3);
          margin-top: var(--space-4);
        }

        .control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: 50%;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .control-btn:hover {
          background: var(--color-bg-hover);
        }

        .control-btn.off {
          background: hsla(0, 84%, 55%, 0.15);
          border-color: hsla(0, 84%, 55%, 0.3);
          color: var(--color-error);
        }

        .device-settings {
          margin-top: var(--space-4);
          padding: var(--space-4);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .device-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .device-group:last-child {
          margin-bottom: 0;
        }

        .device-label {
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          color: var(--color-text-secondary);
        }

        .device-select {
          padding: var(--space-2) var(--space-3);
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-sm);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          cursor: pointer;
        }

        .card-footer {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
        }

        .ready-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          width: 100%;
          padding: var(--space-4);
          background: var(--color-accent-primary);
          border: none;
          border-radius: var(--radius-lg);
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          color: hsl(142, 71%, 8%);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .ready-btn:hover {
          background: var(--color-accent-primary-hover);
        }

        .ready-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .waiting-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: hsla(217, 91%, 60%, 0.1);
          border: 1px solid hsla(217, 91%, 60%, 0.3);
          border-radius: var(--radius-md);
          text-align: center;
        }

        .waiting-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--color-accent-secondary);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .waiting-text {
          font-size: var(--text-sm);
          color: var(--color-accent-secondary);
        }

        .leave-btn {
          background: none;
          border: 1px solid var(--color-border-default);
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
        }

        .leave-btn:hover {
          border-color: var(--color-error);
          color: var(--color-error);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: hsla(0, 84%, 55%, 0.1);
          border: 1px solid hsla(0, 84%, 55%, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-error);
          font-size: var(--text-sm);
        }
      `}</style>

            <div className="green-room-card">
                <div className="card-header">
                    <span className="room-badge">
                        <Video size={12} />
                        Room: {roomId}
                    </span>
                    <h1 className="card-title">Green Room</h1>
                    <p className="card-subtitle">
                        Test your camera and microphone before joining
                    </p>
                </div>

                <div className="preview-section">
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            {error}
                            <button onClick={initializeMedia} style={{ marginLeft: "auto" }}>
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    )}

                    <div className="video-preview">
                        {isVideoEnabled && stream ? (
                            <video ref={videoRef} autoPlay playsInline muted />
                        ) : (
                            <div className="video-off-placeholder">
                                <VideoOff size={48} />
                                <span>Camera is off</span>
                            </div>
                        )}
                        <span className="name-badge">{guestName}</span>
                    </div>

                    <div className="controls-row">
                        <button
                            className={`control-btn ${!isAudioEnabled ? "off" : ""}`}
                            onClick={toggleAudio}
                            title={isAudioEnabled ? "Mute" : "Unmute"}
                        >
                            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        <button
                            className={`control-btn ${!isVideoEnabled ? "off" : ""}`}
                            onClick={toggleVideo}
                            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                        >
                            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>
                        <button
                            className="control-btn"
                            onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    {showDeviceSettings && (
                        <div className="device-settings">
                            <div className="device-group">
                                <label className="device-label">Microphone</label>
                                <select
                                    className="device-select"
                                    value={selectedAudio}
                                    onChange={(e) => switchDevice("audio", e.target.value)}
                                >
                                    {audioDevices.map((device) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="device-group">
                                <label className="device-label">Camera</label>
                                <select
                                    className="device-select"
                                    value={selectedVideo}
                                    onChange={(e) => switchDevice("video", e.target.value)}
                                >
                                    {videoDevices.map((device) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card-footer">
                    {isReady && isWaiting ? (
                        <div className="waiting-state">
                            <div className="waiting-spinner" />
                            <span className="waiting-text">
                                Waiting for {hostName} to let you in...
                            </span>
                            <button className="leave-btn" onClick={onLeave}>
                                Leave
                            </button>
                        </div>
                    ) : (
                        <button
                            className="ready-btn"
                            onClick={handleReady}
                            disabled={!stream || !!error}
                        >
                            <Check size={20} />
                            I'm Ready to Join
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
