"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Check,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

export default function JoinPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const code = params.code as string;
    const guestName = searchParams.get("name") || "Guest";

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roomStatus, setRoomStatus] = useState<"loading" | "valid" | "invalid">(
        "loading"
    );

    // Initialize media
    useEffect(() => {
        initializeMedia();
        checkRoom();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const checkRoom = async () => {
        // In a real app, this would verify the room code with the backend
        // For demo, we'll just simulate a valid room
        setTimeout(() => {
            setRoomStatus("valid");
        }, 1000);
    };

    const initializeMedia = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: { echoCancellation: true, noiseSuppression: true },
            });
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
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

    const handleJoin = () => {
        setIsReady(true);
        setIsWaiting(true);
        // In a real app, this would connect to the signaling server
        // and wait for the host to admit the guest
    };

    if (roomStatus === "loading") {
        return (
            <div className="join-container">
                <style jsx>{`
          .join-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--color-bg-primary);
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--color-border-default);
            border-top-color: var(--color-accent-secondary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (roomStatus === "invalid") {
        return (
            <div className="join-container">
                <style jsx>{`
          .join-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--color-bg-primary);
            text-align: center;
            padding: var(--space-8);
          }
          .error-icon {
            color: var(--color-error);
            margin-bottom: var(--space-4);
          }
          h1 {
            font-size: var(--text-2xl);
            color: var(--color-text-primary);
            margin-bottom: var(--space-2);
          }
          p {
            color: var(--color-text-secondary);
          }
        `}</style>
                <AlertCircle size={64} className="error-icon" />
                <h1>Room Not Found</h1>
                <p>This room doesn't exist or the invitation has expired.</p>
            </div>
        );
    }

    return (
        <div className="join-page">
            <style jsx>{`
        .join-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--color-bg-primary);
          padding: var(--space-8);
        }

        .join-card {
          width: 100%;
          max-width: 560px;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .card-header {
          padding: var(--space-6);
          text-align: center;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .card-header h1 {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .card-header p {
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

        .video-off-state {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          color: var(--color-text-muted);
        }

        .name-label {
          position: absolute;
          bottom: var(--space-3);
          left: var(--space-3);
          padding: var(--space-1) var(--space-3);
          background: rgba(0, 0, 0, 0.7);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          color: white;
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: var(--space-3);
          margin-top: var(--space-4);
        }

        .control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
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

        .card-footer {
          padding: var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
        }

        .join-btn {
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

        .join-btn:hover:not(:disabled) {
          background: var(--color-accent-primary-hover);
        }

        .join-btn:disabled {
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
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-accent-secondary);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .waiting-text {
          font-size: var(--text-sm);
          color: var(--color-accent-secondary);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          margin-bottom: var(--space-4);
          background: hsla(0, 84%, 55%, 0.1);
          border: 1px solid hsla(0, 84%, 55%, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-error);
          font-size: var(--text-sm);
        }

        .retry-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--color-error);
          cursor: pointer;
        }
      `}</style>

            <div className="join-card">
                <div className="card-header">
                    <h1>Join Broadcast</h1>
                    <p>Room: {code}</p>
                </div>

                <div className="preview-section">
                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={16} />
                            {error}
                            <button className="retry-btn" onClick={initializeMedia}>
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    )}

                    <div className="video-preview">
                        {isVideoEnabled && stream ? (
                            <video ref={videoRef} autoPlay playsInline muted />
                        ) : (
                            <div className="video-off-state">
                                <VideoOff size={48} />
                                <span>Camera Off</span>
                            </div>
                        )}
                        <span className="name-label">{guestName}</span>
                    </div>

                    <div className="controls">
                        <button
                            className={`control-btn ${!isAudioEnabled ? "off" : ""}`}
                            onClick={toggleAudio}
                        >
                            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        <button
                            className={`control-btn ${!isVideoEnabled ? "off" : ""}`}
                            onClick={toggleVideo}
                        >
                            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                    </div>
                </div>

                <div className="card-footer">
                    {isWaiting ? (
                        <div className="waiting-state">
                            <div className="waiting-spinner" />
                            <span className="waiting-text">
                                Waiting for the host to let you in...
                            </span>
                        </div>
                    ) : (
                        <button
                            className="join-btn"
                            onClick={handleJoin}
                            disabled={!stream || !!error}
                        >
                            <Check size={20} />
                            Join Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
