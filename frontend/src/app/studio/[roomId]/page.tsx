"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Video,
    Settings,
    Users,
    Layers,
    Plus,
    Copy,
    Type,
    Palette,
    BarChart2,
    Radio,
    Clock,
    ExternalLink,
    ChevronRight,
    Monitor,
    MessageSquare,
    Wifi,
    PanelRightOpen,
    PanelRightClose,
} from "lucide-react";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// App Components & Logic
import { BackgroundEffects } from "@/components/ui/BackgroundEffects";
import { BrandSettings } from "@/components/studio/BrandSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useToastStore } from "@/stores/toastStore";
import { useStudioStore } from "@/stores/studioStore";
import { PollsManager } from "@/components/studio/PollsManager";
import { BannersManager } from "@/components/studio/BannersManager";
import { GuestManagement } from "@/components/studio/GuestManagement";
import { SettingsModal } from "@/components/studio/SettingsModal";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { SceneManager } from "@/components/studio/SceneManager";
import { CreateSceneModal } from "@/components/studio/CreateSceneModal";
import { DestinationsPanel } from "@/components/studio/DestinationsPanel";
import { StreamHealth } from "@/components/studio/StreamHealth";
import { apiClient } from "@/lib/api/client";
import { signalingClient } from "@/lib/api/signaling";
import { BannerData } from "@/components/studio/BannerOverlay";
import { useSimulatedStats } from "@/hooks/useLiveKitStats";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Fetch LiveKit token from backend
 */
async function getToken(roomName: string, participantName: string): Promise<string> {
    const token = localStorage.getItem("auth_token");

    // If no auth token, try guest token endpoint
    if (!token) {
        const response = await fetch(`${API_URL}/api/livekit/guest-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                roomName,
                participantName: participantName || "Host",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to get token from server");
        }

        const data = await response.json();
        return data.token;
    }

    // Use authenticated token endpoint
    const response = await fetch(`${API_URL}/api/livekit/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            roomName,
            participantName,
            isHost: true,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get token from server");
    }

    const data = await response.json();
    return data.token;
}

export default function StudioPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { user, loading } = useAuth();
    const { addToast } = useToastStore();
    const {
        isLive, setIsLive, streamTime, incrementStreamTime,
        scenes, activeSceneId, setActiveScene, addScene, removeScene, updateScene
    } = useStudioStore();

    const [activeTab, setActiveTab] = useState("scenes");
    const [copied, setCopied] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateSceneOpen, setIsCreateSceneOpen] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(true);

    // Media Device State
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    // Guest Management State
    const [waitingGuests, setWaitingGuests] = useState<Array<{ clientId: string; name: string }>>([]);

    // Banner State
    const [banners, setBanners] = useState<BannerData[]>([
        { id: "1", text: "Welcome to StreamStudio! 🚀", style: "standard" },
        { id: "2", text: "Follow us on Twitter @StreamStudio", style: "ticker" },
    ]);
    const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);

    // Right Sidebar State
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    // Stream Health Stats - use the hook for simulated/real stats
    const streamStats = useSimulatedStats(isLive, streamTime);

    // Destinations state for Go Live integration
    interface Destination {
        id: string;
        platform: string;
        name: string;
        streamKey: string;
        streamUrl: string;
        enabled: boolean;
        egressId?: string;
    }
    const [enabledDestinations, setEnabledDestinations] = useState<Destination[]>([]);

    // Highlighted Chat Message (for overlay)
    interface HighlightedMessage {
        id: string;
        authorName: string;
        authorPhoto?: string;
        message: string;
        platform: "youtube" | "twitch" | "facebook" | "local";
        isModerator?: boolean;
        isOwner?: boolean;
        expiresAt?: number;
    }
    const [highlightedChatMessage, setHighlightedChatMessage] = useState<HighlightedMessage | null>(null);

    const handleHighlightMessage = (msg: any) => {
        setHighlightedChatMessage({
            ...msg,
            expiresAt: Date.now() + 10000, // 10 seconds
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            setHighlightedChatMessage(current =>
                current?.id === msg.id ? null : current
            );
        }, 10000);
    };

    const handleDismissHighlight = () => {
        setHighlightedChatMessage(null);
    };

    // Protect the route
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Enumerate media devices when settings modal opens
    useEffect(() => {
        if (!isSettingsOpen) return;

        const enumerateDevices = async () => {
            try {
                // Request permissions first to get proper device labels
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                setLocalStream(stream);

                const devices = await navigator.mediaDevices.enumerateDevices();

                const audioInputs = devices.filter(d => d.kind === "audioinput");
                const videoInputs = devices.filter(d => d.kind === "videoinput");

                setAudioDevices(audioInputs);
                setVideoDevices(videoInputs);

                // Set defaults if not already set
                if (!selectedAudioDevice && audioInputs.length > 0) {
                    setSelectedAudioDevice(audioInputs[0].deviceId);
                }
                if (!selectedVideoDevice && videoInputs.length > 0) {
                    setSelectedVideoDevice(videoInputs[0].deviceId);
                }

                console.log(`[DEVICES] Found ${audioInputs.length} mics, ${videoInputs.length} cameras`);
            } catch (error) {
                console.error("[DEVICES] Failed to enumerate devices:", error);
                addToast("Please allow camera and microphone access", "error");
            }
        };

        enumerateDevices();

        // Cleanup stream when modal closes
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isSettingsOpen]);

    // Initialize Signaling
    useEffect(() => {
        if (!user || !roomId) return;

        console.log(`[HOST] 🎬 Initializing signaling for room: ${roomId}`);

        const connectSignaling = async () => {
            console.log(`[HOST] 🔌 Connecting to signaling server...`);
            signalingClient.connect();

            try {
                // Wait for WebSocket to be OPEN and clientId to be assigned
                const clientId = await signalingClient.waitForReady(10000);
                console.log(`[HOST] ✅ Connected with clientId: ${clientId}. Creating room: ${roomId}`);

                // Now safe to send - use queue in case of edge cases
                signalingClient.send("create-room", {
                    roomId,
                    userId: user.id || "host",
                    name: user.email || "Host"
                }, true);
            } catch (error) {
                console.error(`[HOST] ❌ Failed to connect:`, error);
                addToast("Failed to connect to signaling server", "error");
            }
        };

        const onGuestWaiting = (payload: { clientId: string; name: string }) => {
            console.log(`[HOST] 🚪 GUEST WAITING:`, payload);
            console.log(`[HOST] 👤 Guest name: ${payload.name}, clientId: ${payload.clientId}`);
            setWaitingGuests(prev => {
                if (prev.some(g => g.clientId === payload.clientId)) {
                    console.log(`[HOST] ⚠️ Guest ${payload.name} already in waiting list`);
                    return prev;
                }
                console.log(`[HOST] ➕ Adding ${payload.name} to waiting list. Total: ${prev.length + 1}`);
                return [...prev, payload];
            });
            addToast(`${payload.name} is waiting to join`, "info");
        };

        const onParticipantJoined = (payload: { clientId: string }) => {
            console.log(`[HOST] ✅ Participant joined:`, payload);
            setWaitingGuests(prev => prev.filter(g => g.clientId !== payload.clientId));
        };

        const onParticipantLeft = (payload: { clientId: string }) => {
            console.log(`[HOST] 👋 Participant left:`, payload);
            setWaitingGuests(prev => prev.filter(g => g.clientId !== payload.clientId));
        };

        const onRoomCreated = (payload: { roomId: string }) => {
            console.log(`[HOST] 🎉 Room created successfully:`, payload);
            addToast("Room ready for guests!", "success");
        };

        const onBannerUpdate = (payload: { activeBanner: BannerData | null; banners: BannerData[] }) => {
            if (payload.banners) setBanners(payload.banners);
            // Only update active banner if explicitly sent (or infer from state if needed, but payload is safest)
            if (payload.activeBanner !== undefined) setActiveBanner(payload.activeBanner);
        };

        const onError = (payload: { message: string }) => {
            console.warn(`[HOST] ⚠️ Signaling error:`, payload);
            if (payload.message === "Room already exists") {
                console.log(`[HOST] ℹ️ Room already exists - this is OK, we're reconnecting`);
                return;
            }
            addToast(`Signaling: ${payload.message}`, "error");
        };

        const onConnected = () => {
            console.log(`[HOST] 🔌 Signaling connected. ClientId: ${signalingClient.getClientId()}`);
        };

        const onDisconnected = () => {
            console.log(`[HOST] 🔴 Signaling disconnected`);
        };

        signalingClient.on("connect", onConnected);
        signalingClient.on("disconnect", onDisconnected);
        signalingClient.on("room-created", onRoomCreated);
        signalingClient.on("guest-waiting", onGuestWaiting);
        signalingClient.on("participant-joined", onParticipantJoined);
        signalingClient.on("participant-left", onParticipantLeft);
        signalingClient.on("banner-update", onBannerUpdate);
        signalingClient.on("error", onError);

        console.log(`[HOST] 📡 Event listeners registered, connecting...`);
        connectSignaling();

        return () => {
            console.log(`[HOST] 🧹 Cleaning up signaling listeners`);
            signalingClient.off("connect", onConnected);
            signalingClient.off("disconnect", onDisconnected);
            signalingClient.off("room-created", onRoomCreated);
            signalingClient.off("guest-waiting", onGuestWaiting);
            signalingClient.off("participant-joined", onParticipantJoined);
            signalingClient.off("participant-left", onParticipantLeft);
            signalingClient.off("banner-update", onBannerUpdate);
            signalingClient.off("error", onError);
            signalingClient.disconnect();
        };
    }, [user, roomId, addToast]);

    // Fetch LiveKit token
    useEffect(() => {
        if (user && roomId) {
            setIsConnecting(true);
            getToken(roomId, user.email || "Host")
                .then((t) => {
                    setToken(t);
                    setTokenError(null);
                })
                .catch((err) => {
                    setTokenError(err.message);
                    addToast(`Connection error: ${err.message}`, "error");
                })
                .finally(() => setIsConnecting(false));
        }
    }, [user, roomId, addToast]);

    // Stream timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLive) {
            interval = setInterval(() => incrementStreamTime(), 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLive, incrementStreamTime]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleCopyInvite = async () => {
        const inviteUrl = `${window.location.origin}/join/${roomId}`;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        addToast("Invite link copied!", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGoLive = async () => {
        if (isLive) {
            // End stream - stop all destinations first
            try {
                console.log("[GO LIVE] Ending stream...");

                // Stop all active egress streams
                for (const dest of enabledDestinations) {
                    if (dest.egressId) {
                        try {
                            await apiClient.egress.stopStream(dest.egressId);
                            console.log(`[GO LIVE] Stopped egress for ${dest.name}`);
                        } catch (e) {
                            console.error(`[GO LIVE] Failed to stop egress for ${dest.name}:`, e);
                        }
                    }
                }
                setEnabledDestinations([]);

                await apiClient.rooms.end(roomId);
                setIsLive(false);
                addToast("Stream ended successfully", "info");
            } catch (error: any) {
                addToast(`Failed to end stream: ${error.message}`, "error");
            }
        } else {
            // Go live - start the room and all configured destinations
            try {
                console.log("[GO LIVE] Starting stream...");
                await apiClient.rooms.start(roomId);
                setIsLive(true);
                addToast("You are now LIVE!", "success");

                // Note: Destinations are started manually from the Destinations panel
                // This is intentional - users may want to go live in the studio
                // before starting RTMP output to platforms
                addToast("Go to Destinations tab to start streaming to platforms", "info");
            } catch (error: any) {
                addToast(`Failed to go live: ${error.message}`, "error");
            }
        }
    };

    const handleAdmitGuest = (guestId: string) => {
        signalingClient.send("admit-guest", { guestId });
        setWaitingGuests(prev => prev.filter(g => g.clientId !== guestId));
        addToast("Guest admitted", "success");
    };

    const handleRemoveGuest = (guestId: string) => {
        signalingClient.send("remove-guest", { guestId });
        setWaitingGuests(prev => prev.filter(g => g.clientId !== guestId));
        addToast("Guest denied/removed", "info");
    };

    const handleBannerChange = (newBanners: BannerData[], newActiveBanner: BannerData | null) => {
        // Optimistic update
        setBanners(newBanners);
        setActiveBanner(newActiveBanner);

        // Broadcast via signaling
        signalingClient.send("banner-update", {
            banners: newBanners,
            activeBanner: newActiveBanner
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Authenticating...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            <BackgroundEffects />
            {/* Header */}
            <header className="flex items-center justify-between h-[var(--header-height)] px-6 bg-card border-b border-border shadow-sm z-50">
                {/* Left Section */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-primary/20 p-2 rounded-xl">
                            <Video className="text-primary w-6 h-6" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-base font-bold tracking-tight">StreamStudio</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                                <span>Room</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                                <span className="text-foreground/80">{roomId}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Section: Status Indicator */}
                <div className="flex items-center gap-4 bg-secondary/50 px-4 py-1.5 rounded-full border border-border/50">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLive ? "bg-destructive animate-live-pulse" : "bg-muted-foreground/50"}`} />
                        <span className={`text-xs font-bold tracking-wider uppercase ${isLive ? "text-destructive" : "text-muted-foreground"}`}>
                            {isLive ? "Live" : "Off Air"}
                        </span>
                    </div>
                    {isLive && (
                        <>
                            <Separator orientation="vertical" className="h-4 bg-border/50" />
                            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-foreground/90">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {formatTime(streamTime)}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Section: Controls */}
                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleCopyInvite} className="rounded-xl border border-border/40 hover:bg-secondary">
                                    <Copy className={`w-4 h-4 ${copied ? "text-primary" : ""}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{copied ? "Copied!" : "Copy Invite Link"}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="rounded-xl border border-border/40 hover:bg-secondary">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Studio Settings</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        onClick={handleGoLive}
                        variant={isLive ? "destructive" : "default"}
                        className={`rounded-xl px-6 h-10 font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all gap-2`}
                    >
                        <Radio className="w-4 h-4" />
                        {isLive ? "End Stream" : "Go Live"}
                    </Button>
                </div>
            </header>

            {/* Main Studio Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Controls & Assets */}
                <aside className="w-[var(--sidebar-width)] flex flex-col bg-card border-r border-border shrink-0 z-40">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                        <div className="p-4 border-b border-border/60">
                            <TabsList className="grid grid-cols-7 h-12 bg-secondary/30 p-1 rounded-xl">
                                <TabsTrigger value="scenes" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Layers className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="guests" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Users className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="brand" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Palette className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="banners" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Type className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="interactions" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><BarChart2 className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="destinations" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Wifi className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><MessageSquare className="w-4 h-4" /></TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-5">
                                <TabsContent value="scenes" className="m-0 space-y-4">
                                    <SceneManager
                                        scenes={scenes.map(s => ({ ...s, isActive: s.id === activeSceneId, sources: s.sources.map(src => ({ id: src.id, type: src.type, name: src.type })) }))}
                                        activeSceneId={activeSceneId}
                                        onSelectScene={setActiveScene}
                                        onAddScene={() => setIsCreateSceneOpen(true)}
                                        onRemoveScene={removeScene}
                                        onRenameScene={(id, name) => updateScene(id, { name })}
                                        onChangeLayout={(id, layout) => updateScene(id, { layout })}
                                    />
                                </TabsContent>

                                <TabsContent value="guests" className="m-0 space-y-6">
                                    <GuestManagement
                                        guests={[]}
                                        waitingGuests={waitingGuests}
                                        onInvite={async () => {
                                            const url = `${window.location.origin}/join/${roomId}`;
                                            return url;
                                        }}
                                        onAdmit={handleAdmitGuest}
                                        onRemove={handleRemoveGuest}
                                        isHost={true}
                                    />
                                </TabsContent>

                                <TabsContent value="brand" className="m-0"><BrandSettings /></TabsContent>
                                <TabsContent value="banners" className="m-0">
                                    <BannersManager
                                        banners={banners}
                                        activeBanner={activeBanner}
                                        onUpdate={handleBannerChange}
                                    />
                                </TabsContent>
                                <TabsContent value="interactions" className="m-0"><PollsManager /></TabsContent>
                                <TabsContent value="destinations" forceMount className={`m-0 ${activeTab !== "destinations" ? "hidden" : ""}`}>
                                    <DestinationsPanel
                                        roomName={roomId}
                                        isLive={isLive}
                                        onDestinationsChange={(dests) => {
                                            // Track destinations with egress IDs for Go Live integration
                                            const activeWithEgress = dests.filter(d => d.egressId);
                                            setEnabledDestinations(activeWithEgress.map(d => ({
                                                ...d,
                                                enabled: d.status === 'live',
                                            })));
                                        }}
                                    />
                                </TabsContent>
                                <TabsContent value="chat" forceMount className={`m-0 -mx-5 -mb-5 ${activeTab !== "chat" ? "hidden" : ""}`}>
                                    <ChatPanel
                                        roomId={roomId}
                                        onHighlightMessage={handleHighlightMessage}
                                    />
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </aside>

                {/* Main Canvas Area */}
                <main className="flex-1 relative bg-background/50 flex items-center justify-center p-6 md:p-10">
                    {/* Studio Video Frame */}
                    <div className="w-full h-full max-w-[1440px] flex items-center justify-center relative group">
                        <div className="w-full aspect-video rounded-3xl bg-secondary/20 border border-border shadow-2xl overflow-hidden glass-morphism relative">
                            {tokenError ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center bg-card/60 backdrop-blur-xl">
                                    <div className="bg-destructive/10 p-5 rounded-full">
                                        <Video className="w-12 h-12 text-destructive" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-bold">Connection Failed</h2>
                                        <p className="text-muted-foreground max-w-md">{tokenError}</p>
                                    </div>
                                    <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl px-10 gap-2">
                                        <Radio className="w-4 h-4 animate-pulse" />
                                        Attempt Reconnect
                                    </Button>
                                </div>
                            ) : isConnecting ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-card/40 backdrop-blur-md">
                                    <Skeleton className="w-[80%] h-[80%] rounded-2xl bg-muted/40" />
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                        <span className="text-sm font-medium tracking-wide animate-pulse">Establishing LiveKit Handshake...</span>
                                    </div>
                                </div>
                            ) : !token ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/10">
                                    <Badge variant="outline" className="animate-pulse py-1 px-4">Waiting for Token</Badge>
                                </div>
                            ) : (
                                <LiveKitRoom
                                    token={token}
                                    serverUrl={LIVEKIT_URL}
                                    connect={true}
                                    video={true}
                                    audio={true}
                                    className="h-full w-full"
                                    options={{
                                        adaptiveStream: false,
                                        dynacast: true,
                                        stopLocalTrackOnUnpublish: true,
                                        disconnectOnPageLeave: false,
                                        reconnectPolicy: {
                                            nextRetryDelayInMs: (context) => {
                                                // Stop retrying after 10 attempts
                                                if (context.retryCount >= 10) {
                                                    console.log(`[LIVEKIT] Max retries (10) exceeded, stopping reconnection`);
                                                    return null;
                                                }
                                                // Exponential backoff with max 30 seconds
                                                const delay = Math.min(30000, 1000 * Math.pow(2, context.retryCount));
                                                console.log(`[LIVEKIT] Reconnect attempt ${context.retryCount + 1}, waiting ${delay}ms`);
                                                return delay;
                                            },
                                        },
                                    }}
                                    onConnected={() => console.log("[LIVEKIT] Connected to room")}
                                    onDisconnected={() => console.log("[LIVEKIT] Disconnected from room")}
                                    onError={(error) => console.error("[LIVEKIT] Room error:", error)}
                                >
                                    <StudioLayout
                                        isLive={isLive}
                                        onGoLive={handleGoLive}
                                        onOpenSettings={() => setIsSettingsOpen(true)}
                                        recordingDuration={formatTime(streamTime)}
                                        activeBanner={activeBanner}
                                        highlightedMessage={highlightedChatMessage}
                                        onDismissHighlight={handleDismissHighlight}
                                        activeLayout={scenes.find(s => s.id === activeSceneId)?.layout || "solo"}
                                        sources={scenes.find(s => s.id === activeSceneId)?.sources || []}
                                        onSourcesChange={(newSources) => updateScene(activeSceneId, { sources: newSources })}
                                    />
                                    <RoomAudioRenderer />
                                </LiveKitRoom>
                            )}
                        </div>

                        {/* Subtle Overlay Overlay */}
                        {!isLive && token && (
                            <div className="absolute top-8 left-8">
                                <Badge variant="secondary" className="bg-black/40 backdrop-blur-md border-white/5 text-white/80 py-1.5 px-4 rounded-xl font-semibold tracking-wide uppercase text-[10px]">
                                    Preview Mode
                                </Badge>
                            </div>
                        )}

                        {/* Waiting Guests Notification Overlay */}
                        {waitingGuests.length > 0 && (
                            <div className="absolute top-8 right-8 animate-in slide-in-from-right-10 bounce-in duration-500">
                                <Button
                                    onClick={() => setActiveTab("guests")}
                                    className="h-10 px-4 rounded-xl bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-500/20 font-bold gap-2"
                                >
                                    <Users className="w-4 h-4" />
                                    {waitingGuests.length} Waiting
                                </Button>
                            </div>
                        )}

                        {/* Right Sidebar Toggle */}
                        <div className="absolute bottom-8 right-8">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => setShowRightSidebar(!showRightSidebar)}
                                            className="rounded-xl h-10 w-10 shadow-lg"
                                        >
                                            {showRightSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{showRightSidebar ? "Hide Stream Info" : "Show Stream Info"}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Stream Health */}
                {showRightSidebar && (
                    <aside className="w-[280px] flex flex-col bg-card border-l border-border shrink-0 z-40 animate-in slide-in-from-right-5 duration-300">
                        <div className="p-4 border-b border-border/60">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Wifi className="w-3.5 h-3.5 text-primary" />
                                Stream Health
                            </h3>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4">
                                <StreamHealth
                                    isLive={isLive}
                                    stats={{
                                        ...streamStats,
                                        duration: streamTime,
                                    }}
                                />
                            </div>
                        </ScrollArea>
                    </aside>
                )}
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => {
                    setIsSettingsOpen(false);
                    // Stop the stream when modal closes
                    if (localStream) {
                        localStream.getTracks().forEach(track => track.stop());
                        setLocalStream(null);
                    }
                }}
                audioDevices={audioDevices}
                videoDevices={videoDevices}
                selectedAudioDevice={selectedAudioDevice}
                selectedVideoDevice={selectedVideoDevice}
                onAudioDeviceChange={setSelectedAudioDevice}
                onVideoDeviceChange={setSelectedVideoDevice}
                localStream={localStream}
            />

            {/* Create Scene Modal */}
            <CreateSceneModal
                isOpen={isCreateSceneOpen}
                onClose={() => setIsCreateSceneOpen(false)}
                onCreate={(sceneData) => {
                    const newScene = {
                        id: `scene-${Date.now()}`,
                        name: sceneData.name,
                        layout: sceneData.layout,
                        sources: [],
                    };
                    addScene(newScene);
                    setActiveScene(newScene.id);
                    addToast(`Scene "${sceneData.name}" created`, "success");
                }}
            />
        </div>
    );
}
