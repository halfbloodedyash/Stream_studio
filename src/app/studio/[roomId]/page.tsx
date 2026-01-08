"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Video,
    Mic,
    MicOff,
    VideoOff,
    Monitor,
    Radio,
    Settings,
    Users,
    Layers,
    MessageSquare,
    MoreVertical,
    Plus,
    Copy,
    ExternalLink,
    Circle,
    AlertCircle,
    LogOut,
    Type,
    Palette,
    BarChart2,
} from "lucide-react";
import styles from "../studio.module.css";
import { ParticipantTile } from "@/components/studio/ParticipantTile";
import { ControlBar } from "@/components/studio/ControlBar";
import { BrandSettings } from "@/components/studio/BrandSettings";
import { LowerThird } from "@/components/overlays/LowerThird";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useAudioProcessor } from "@/hooks/useAudioProcessor";
import { useRecording } from "@/lib/recording/RecordingManager";
import { useStudioStore } from "@/stores/studioStore";
import { useBrandingStore } from "@/stores/brandingStore";
import { usePollsStore, Poll } from "@/stores/pollsStore";
import { useAuth } from "@/contexts/AuthContext";
import { useToastStore } from "@/stores/toastStore";
import { apiClient } from "@/lib/api/client";
import { VideoCompositor } from "@/lib/canvas/VideoCompositor";

import { PollsManager } from "@/components/studio/PollsManager";
import { BannersManager } from "@/components/studio/BannersManager";
import { SettingsModal } from "@/components/studio/SettingsModal";
import { CreateSceneModal } from "@/components/studio/CreateSceneModal";

type TabType = "guests" | "scenes" | "comments" | "brand" | "banners" | "interactions";

export default function StudioPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { user, loading, signOut } = useAuth();
    const { addToast } = useToastStore();

    const [activeTab, setActiveTab] = useState<TabType>("scenes");
    const [copied, setCopied] = useState(false);
    const [showLowerThird, setShowLowerThird] = useState(false);
    const [lowerThirdData, setLowerThirdData] = useState({ name: "", title: "" });
    const [activeRightTab, setActiveRightTab] = useState<"comments" | "destinations">("comments");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateSceneOpen, setIsCreateSceneOpen] = useState(false);

    // Protect the route - redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const {
        isLive,
        isRecording,
        streamTime,
        scenes,
        activeSceneId,
        setIsLive,
        setIsRecording,
        incrementStreamTime,
        setActiveScene,
        addScene,
    } = useStudioStore();

    const {
        primaryColor,
        logo,
        background,
        clips,
        activeClipId,
        setActiveClip,
    } = useBrandingStore();

    const [compositor, setCompositor] = useState<VideoCompositor | null>(null);

    const {
        localStream,
        screenStream,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        initializeMedia,
        switchAudioDevice,
        switchVideoDevice,
        audioDevices,
        videoDevices,
        selectedAudioDevice,
        selectedVideoDevice,
        error: mediaError,
    } = useMediaDevices();

    // Audio mixing
    const audioProcessor = useAudioProcessor();

    // Add audio sources to processor
    useEffect(() => {
        if (localStream && isAudioEnabled) {
            audioProcessor.addSource({
                id: "mic",
                type: "microphone",
                name: "Microphone",
                stream: localStream,
                volume: 1,
                muted: false,
                pan: 0,
            });
            audioProcessor.start();
        } else {
            audioProcessor.removeSource("mic");
        }
    }, [localStream, isAudioEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (screenStream) {
            audioProcessor.addSource({
                id: "screen",
                type: "screen",
                name: "Screen Audio",
                stream: screenStream,
                volume: 1,
                muted: false,
                pan: 0,
            });
        } else {
            audioProcessor.removeSource("screen");
        }
    }, [screenStream]); // eslint-disable-line react-hooks/exhaustive-deps

    // Recording functionality
    const recording = useRecording();

    // Sync recording state with store
    useEffect(() => {
        setIsRecording(recording.isRecording);
    }, [recording.isRecording, setIsRecording]);

    // Initialize media on mount - only once
    useEffect(() => {
        const init = async () => {
            console.log("🎥 Initializing media devices...");
            await initializeMedia();

            // Initialize compositor
            const canvas = document.createElement("canvas");
            const newCompositor = new VideoCompositor(canvas);
            newCompositor.start();
            setCompositor(newCompositor);
        };
        init();

        return () => {
            if (compositor) compositor.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once

    // Sync branding with compositor
    useEffect(() => {
        if (!compositor) return;

        compositor.setLogoImage(logo.visible && logo.url ? logo.url : null);
        compositor.setBackgroundImage(background.visible && background.url ? background.url : null);

        if (activeClipId) {
            const clip = clips.find(c => c.id === activeClipId);
            if (clip) {
                compositor.playClip(clip.url, () => {
                    setActiveClip(null);
                });
            }
        }
    }, [compositor, logo, background, activeClipId, clips, setActiveClip]);

    // Debug log stream changes
    useEffect(() => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            const audioTracks = localStream.getAudioTracks();
            console.log("✅ Local stream ready:", {
                videoTracks: videoTracks.map(t => ({ id: t.id, enabled: t.enabled, label: t.label })),
                audioTracks: audioTracks.map(t => ({ id: t.id, enabled: t.enabled, label: t.label })),
            });
        } else {
            console.log("❌ No local stream");
        }
    }, [localStream]);

    // Stream timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLive) {
            interval = setInterval(() => {
                incrementStreamTime();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLive, incrementStreamTime]);

    // Use engagement stores
    const { polls } = usePollsStore();

    // Sync compositor with participants and layout
    useEffect(() => {
        if (!compositor) return;

        // Clear existing sources that are no longer present
        // (Actually VideoCompositor.sources is a Map, we can just update/remove)

        // Sync local participant
        if (localStream) {
            const localSource = {
                id: "local",
                type: "camera" as const,
                stream: localStream,
                position: { x: 0, y: 0, width: 100, height: 100 }, // Will be updated by layout
                zIndex: 1,
                visible: isVideoEnabled,
                opacity: 1,
                label: "You (Host)",
            };

            if (compositor.hasSource("local")) {
                compositor.updateSourceStream("local", localStream);
                // We'd also need a way to update visibility/label, adding a method to compositor might be better
                // But for now let's use addSource which overwrites
                compositor.addSource(localSource);
            } else {
                compositor.addSource(localSource);
            }
        } else {
            compositor.removeSource("local");
        }

        // Sync screen share
        if (isScreenSharing && screenStream) {
            const screenSource = {
                id: "screen",
                type: "screen" as const,
                stream: screenStream,
                position: { x: 0, y: 0, width: 100, height: 100 },
                zIndex: 2,
                visible: true,
                opacity: 1,
                label: "Screen Share",
            };
            compositor.addSource(screenSource);
        } else {
            compositor.removeSource("screen");
        }

        // Apply current layout
        const layout = getLayout();
        compositor.setLayout(layout as any);

    }, [compositor, localStream, screenStream, isVideoEnabled, isScreenSharing, scenes, activeSceneId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync compositor with active poll and ticker
    useEffect(() => {
        if (!compositor) return;

        const activePoll = polls.find((p: Poll) => p.isVisible);
        compositor.setPoll(activePoll || null);
    }, [compositor, polls]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleGoLive = async () => {
        if (isLive) {
            // Confirm before ending stream
            if (confirm("Are you sure you want to end the stream?")) {
                try {
                    await apiClient.rooms.end(roomId);
                    setIsLive(false);
                    addToast("Stream ended", "info");
                } catch (error: any) {
                    addToast(`Failed to end stream: ${error.message}`, "error");
                }
            }
        } else {
            try {
                await apiClient.rooms.start(roomId);
                setIsLive(true);
                addToast("You are now LIVE!", "success");
            } catch (error: any) {
                addToast(`Failed to start stream: ${error.message}`, "error");
            }
        }
    };

    const handleCopyInvite = async () => {
        const inviteUrl = `${window.location.origin}/join/${roomId}`;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        addToast("Invite link copied to clipboard", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleScreenShare = async () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            await startScreenShare();
        }
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            await recording.stop();
            // Automatically download to device
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
            const fileName = `stream-studio-recording-${timestamp}`;
            recording.download(fileName);

            // Persist recording metadata to backend
            try {
                await apiClient.rooms.update(roomId, {
                    settings: {
                        lastRecording: {
                            name: fileName,
                            timestamp: new Date().toISOString(),
                            duration: recording.formatDuration()
                        }
                    }
                });
                addToast("Recording saved to your dashboard", "success");
            } catch (error) {
                console.error("Failed to save recording metadata:", error);
                addToast("Recording saved locally, but failed to sync with dashboard", "warning");
            }
        } else {
            if (compositor) {
                // Get composed video stream
                const videoStream = compositor.getStream();

                // Mix with audio
                const combinedStream = audioProcessor.createCombinedStream(videoStream);

                recording.start(combinedStream);
                addToast("Recording started", "info");
            } else {
                addToast("Compositor not ready", "error");
            }
        }
    };

    const handleSceneChange = async (sceneId: string) => {
        setActiveScene(sceneId);
        const scene = scenes.find(s => s.id === sceneId);

        // Auto-trigger screen share if switching to screen share scene
        if (scene?.name === "Screen Share" && !isScreenSharing) {
            try {
                await startScreenShare();
            } catch (error) {
                console.error("Screen share failed:", error);
                addToast("Failed to start screen share", "error");
            }
        }
    };

    const handleAddScene = () => {
        setIsCreateSceneOpen(true);
    };

    const handleCreateScene = (sceneData: { name: string; layout: "solo" | "duo" | "trio" | "quad" | "grid" | "pip" | "sidebar" }) => {
        const newScene = {
            id: `scene-${Date.now()}`,
            name: sceneData.name,
            layout: sceneData.layout,
            sources: [],
        };
        addScene(newScene);
        addToast(`Scene "${sceneData.name}" created`, "success");
    };

    const handleToggleLowerThird = () => {
        if (showLowerThird) {
            setShowLowerThird(false);
        } else {
            const name = prompt("Enter name:");
            const title = prompt("Enter title:");
            if (name && title) {
                setLowerThirdData({ name, title });
                setShowLowerThird(true);
            }
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case "m":
                    e.preventDefault();
                    toggleAudio();
                    break;
                case "v":
                    e.preventDefault();
                    toggleVideo();
                    break;
                case "s":
                    if (e.ctrlKey || e.metaKey) return; // Allow Ctrl+S for save
                    e.preventDefault();
                    handleToggleScreenShare();
                    break;
                case "r":
                    if (e.ctrlKey || e.metaKey) return; // Allow Ctrl+R for refresh
                    e.preventDefault();
                    handleToggleRecording();
                    break;
                case "l":
                    if (e.ctrlKey || e.metaKey) return;
                    e.preventDefault();
                    handleGoLive();
                    break;
                case "t":
                    e.preventDefault();
                    handleToggleLowerThird();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [isAudioEnabled, isVideoEnabled, isScreenSharing, isRecording, isLive, toggleAudio, toggleVideo, handleToggleScreenShare, handleToggleRecording, handleGoLive]);

    // Combine local stream and screen stream into participants list
    // When screen sharing, screen share should be first (main area), then camera (overlay) if enabled
    const participants = (() => {
        if (isScreenSharing && screenStream) {
            // Screen sharing is active
            if (isVideoEnabled && localStream) {
                // Camera is also on - show both
                return [
                    { id: "screen", name: "Screen Share", stream: screenStream, isLocal: false },
                    { id: "local", name: "You (Host)", stream: localStream, isLocal: true },
                ];
            } else {
                // Camera is off - only show screen share
                return [
                    { id: "screen", name: "Screen Share", stream: screenStream, isLocal: false },
                ];
            }
        } else {
            // No screen sharing - just show camera
            return [
                { id: "local", name: "You (Host)", stream: localStream, isLocal: true },
            ];
        }
    })();

    // Determine grid layout based on active scene and participant count
    const getLayout = () => {
        // When screen sharing
        if (isScreenSharing && screenStream) {
            if (isVideoEnabled && localStream) {
                // Camera is on - use picture-in-picture
                return "screenSharePip";
            } else {
                // Camera is off - screen share takes full area
                return "solo";
            }
        }

        const activeScene = scenes.find((s) => s.id === activeSceneId);
        if (activeScene) {
            return activeScene.layout;
        }

        // Fallback to participant count logic
        const count = participants.length;
        if (count === 1) return "solo";
        if (count === 2) return "duo";
        if (count === 3) return "trio";
        if (count === 4) return "quad";
        return "grid";
    };

    return (
        <div className={styles.studioContainer}>
            {/* Header */}
            <header className={styles.studioHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.logo}>
                        <Video className={styles.logoIcon} size={24} />
                        <span>StreamStudio</span>
                    </div>
                    <div className={styles.roomInfo}>
                        <span className={styles.roomTitle}>My Broadcast</span>
                        <span className={styles.roomId}>Room: {roomId}</span>
                    </div>
                </div>

                <div className={styles.headerCenter}>
                    <div className={`${styles.streamStatus} ${isLive ? styles.live : ""}`}>
                        <span className={styles.statusDot}></span>
                        {isLive ? "LIVE" : "OFF AIR"}
                    </div>
                    {isLive && (
                        <span className={styles.timer}>{formatTime(streamTime)}</span>
                    )}
                </div>

                <div className={styles.headerRight}>
                    {isLive && (
                        <button
                            className={`${styles.iconBtn} ${styles.endBroadcastBtn}`}
                            onClick={handleGoLive}
                            title="End Broadcast"
                        >
                            <Radio size={18} />
                            <span>End Broadcast</span>
                        </button>
                    )}
                    <button
                        className={styles.iconBtn}
                        onClick={handleToggleLowerThird}
                        title="Toggle Lower Third"
                    >
                        <Type size={18} />
                    </button>
                    <button className={styles.iconBtn} onClick={handleCopyInvite}>
                        {copied ? (
                            <span style={{ fontSize: "12px" }}>Copied!</span>
                        ) : (
                            <Copy size={18} />
                        )}
                    </button>
                    <button className={styles.iconBtn} onClick={() => setIsSettingsOpen(true)} title="Settings">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className={styles.studioMain}>
                {/* Left Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === "scenes" ? styles.active : ""}`}
                            onClick={() => setActiveTab("scenes")}
                        >
                            <Layers size={16} />
                            Scenes
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "guests" ? styles.active : ""}`}
                            onClick={() => setActiveTab("guests")}
                        >
                            <Users size={16} />
                            Guests
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "brand" ? styles.active : ""}`}
                            onClick={() => setActiveTab("brand")}
                        >
                            <Palette size={16} />
                            Brand
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "banners" ? styles.active : ""}`}
                            onClick={() => setActiveTab("banners")}
                        >
                            <Type size={16} />
                            Banners
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "interactions" ? styles.active : ""}`}
                            onClick={() => setActiveTab("interactions")}
                        >
                            <BarChart2 size={16} />
                            Interactions
                        </button>
                    </div>

                    <div className={styles.sidebarContent}>
                        {activeTab === "scenes" && (
                            <div className={styles.sceneList}>
                                {scenes.map((scene) => (
                                    <div
                                        key={scene.id}
                                        className={`${styles.sceneCard} ${activeSceneId === scene.id ? styles.active : ""
                                            }`}
                                        onClick={() => handleSceneChange(scene.id)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className={styles.sceneThumbnail}>
                                            {scene.layout === "solo" && <Users size={24} />}
                                            {scene.layout === "pip" && <Monitor size={24} />}
                                            {scene.layout === "grid" && <Layers size={24} />}
                                        </div>
                                        <span className={styles.sceneName}>{scene.name}</span>
                                    </div>
                                ))}
                                <div
                                    className={styles.sceneCard}
                                    onClick={handleAddScene}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className={styles.sceneThumbnail}>
                                        <Plus size={24} />
                                    </div>
                                    <span className={styles.sceneName}>Add Scene</span>
                                </div>
                            </div>
                        )}

                        {activeTab === "guests" && (
                            <div className={styles.guestList}>
                                <div className={styles.guestItem}>
                                    <div className={styles.guestAvatar}>Y</div>
                                    <div className={styles.guestInfo}>
                                        <span className={styles.guestName}>You (Host)</span>
                                        <span className={`${styles.guestStatus} ${styles.onAir}`}>
                                            On Air
                                        </span>
                                    </div>
                                    <div className={styles.guestActions}>
                                        <button className={styles.smallBtn}>
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className={styles.iconBtn}
                                    style={{ width: "100%", justifyContent: "center", gap: "8px" }}
                                    onClick={handleCopyInvite}
                                >
                                    <Plus size={16} />
                                    Invite Guest
                                </button>
                            </div>
                        )}

                        {activeTab === "brand" && <BrandSettings />}
                        {activeTab === "banners" && <BannersManager />}
                        {activeTab === "interactions" && <PollsManager />}
                    </div>
                </aside>

                {/* Canvas Area */}
                <main className={styles.canvasArea}>
                    <div className={styles.canvasWrapper}>
                        {/* Media Error Display */}
                        {mediaError && (
                            <div style={{
                                position: "absolute",
                                top: "16px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                padding: "12px 20px",
                                background: "rgba(239, 68, 68, 0.9)",
                                color: "white",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                zIndex: 100,
                                fontSize: "14px"
                            }}>
                                <AlertCircle size={18} />
                                {mediaError}
                            </div>
                        )}

                        <div className={`${styles.videoCanvas} ${isLive ? styles.live : ""}`}>
                            <div className={styles.videoGrid} data-layout={getLayout()}>
                                {participants.map((participant) => (
                                    <ParticipantTile
                                        key={participant.id}
                                        name={participant.name}
                                        stream={participant.stream}
                                        isLocal={participant.isLocal}
                                        isMuted={participant.isLocal ? !isAudioEnabled : false}
                                        isVideoOff={participant.isLocal ? !isVideoEnabled : false}
                                    />
                                ))}
                            </div>
                            {showLowerThird && (
                                <LowerThird
                                    name={lowerThirdData.name}
                                    title={lowerThirdData.title}
                                    onClose={() => setShowLowerThird(false)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Control Bar */}
                    <ControlBar
                        isAudioEnabled={isAudioEnabled}
                        isVideoEnabled={isVideoEnabled}
                        isScreenSharing={isScreenSharing}
                        isLive={isLive}
                        isRecording={isRecording}
                        recordingDuration={recording.formatDuration()}
                        onToggleAudio={toggleAudio}
                        onToggleVideo={toggleVideo}
                        onToggleScreenShare={handleToggleScreenShare}
                        onGoLive={handleGoLive}
                        onToggleRecording={handleToggleRecording}
                        onOpenDestinations={() => setActiveRightTab("destinations")}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />

                    {/* Modals */}
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        audioDevices={audioDevices}
                        videoDevices={videoDevices}
                        selectedAudioDevice={selectedAudioDevice}
                        selectedVideoDevice={selectedVideoDevice}
                        onAudioDeviceChange={switchAudioDevice}
                        onVideoDeviceChange={switchVideoDevice}
                        localStream={localStream}
                    />

                    <CreateSceneModal
                        isOpen={isCreateSceneOpen}
                        onClose={() => setIsCreateSceneOpen(false)}
                        onCreate={handleCreateScene}
                    />
                </main>

                {/* Right Panel */}
                <aside className={styles.rightPanel}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeRightTab === "comments" ? styles.active : ""}`}
                            onClick={() => setActiveRightTab("comments")}
                        >
                            <MessageSquare size={16} />
                            Comments
                        </button>
                        <button
                            className={`${styles.tab} ${activeRightTab === "destinations" ? styles.active : ""}`}
                            onClick={() => setActiveRightTab("destinations")}
                        >
                            <Radio size={16} />
                            Destinations
                        </button>
                    </div>

                    <div className={styles.sidebarContent}>
                        {activeRightTab === "comments" && (
                            <div className={styles.emptyState}>
                                <MessageSquare size={48} />
                                <h4>No Comments Yet</h4>
                                <p>Comments from your stream destinations will appear here.</p>
                            </div>
                        )}

                        {activeRightTab === "destinations" && (
                            <div>
                                <div style={{ padding: "var(--space-3)", borderBottom: "1px solid var(--color-border-subtle)" }}>
                                    <button
                                        style={{
                                            width: "100%",
                                            padding: "var(--space-2) var(--space-3)",
                                            background: "var(--color-accent-primary)",
                                            border: "none",
                                            borderRadius: "var(--radius-md)",
                                            color: "var(--color-bg-primary)",
                                            fontWeight: "var(--font-medium)",
                                            cursor: "pointer",
                                            fontSize: "var(--text-sm)"
                                        }}
                                    >
                                        + Add Destination
                                    </button>
                                </div>
                                <div className={styles.emptyState}>
                                    <Radio size={48} />
                                    <h4>No Destinations</h4>
                                    <p>Add streaming platforms like YouTube, Twitch, or Facebook.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
