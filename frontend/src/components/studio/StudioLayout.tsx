"use client";

import { useLocalParticipant, useTracks, ParticipantTile, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import { ControlBar } from "./ControlBar";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LayoutType } from "@/lib/types/layouts";
import { BannerOverlay, BannerData } from "./BannerOverlay";
import { ChatOverlay, HighlightedMessage } from "./ChatOverlay";
import { SceneCanvas } from "./SceneCanvas";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import { useStudioStore, Source } from "@/stores/studioStore";

interface StudioLayoutProps {
    onOpenSettings?: () => void;
    onGoLive?: () => void;
    isLive?: boolean;
    recordingDuration?: string;
    activeBanner?: BannerData | null;
    highlightedMessage?: HighlightedMessage | null;
    onDismissHighlight?: () => void;
    activeLayout?: LayoutType;
    sources?: Source[];
    onSourcesChange?: (sources: Source[]) => void;
}

export function StudioLayout({
    onOpenSettings,
    onGoLive,
    isLive = false,
    recordingDuration,
    activeBanner,
    highlightedMessage,
    onDismissHighlight,
    activeLayout = "solo",
    sources = [],
    onSourcesChange,
}: StudioLayoutProps) {
    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext();
    const { isEditMode, setEditMode } = useStudioStore();

    // Get all video tracks (camera + screen share)
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    // Filter for screen shares to handle layout differently if needed
    const screenShareTracks = tracks.filter(t => t.source === Track.Source.ScreenShare);
    const cameraTracks = tracks.filter(t => t.source === Track.Source.Camera);

    const toggleScreenShare = useCallback(async () => {
        const isScreenSharing = localParticipant.isScreenShareEnabled;
        try {
            await localParticipant.setScreenShareEnabled(!isScreenSharing, {
                audio: true,
                selfBrowserSurface: "include"
            });
        } catch (e) {
            console.error("Error toggling screen share:", e);
        }
    }, [localParticipant]);

    // Get layout-specific grid classes
    const getLayoutClasses = () => {
        switch (activeLayout) {
            case "solo":
                return "grid-cols-1";
            case "duo":
                return "grid-cols-2";
            case "quad":
                return "grid-cols-2 grid-rows-2";
            case "grid":
                return tracks.length <= 4 ? "grid-cols-2" : "grid-cols-3";
            case "pip":
            case "presentation":
                // These use absolute positioning, not grid
                return "";
            default:
                return "grid-cols-1";
        }
    };

    // Render PiP layout (main + overlay)
    const renderPipLayout = () => {
        const mainTrack = screenShareTracks[0] || cameraTracks[0];
        const overlayTrack = screenShareTracks[0] ? cameraTracks[0] : cameraTracks[1];

        return (
            <div className="relative h-full w-full">
                {mainTrack && (
                    <ParticipantTile
                        trackRef={mainTrack}
                        className="absolute inset-0 rounded-xl overflow-hidden border border-border bg-black/20"
                    />
                )}
                {overlayTrack && (
                    <div className="absolute bottom-4 right-4 w-1/4 aspect-video z-10 shadow-2xl rounded-xl overflow-hidden border-2 border-white/20">
                        <ParticipantTile
                            trackRef={overlayTrack}
                            className="h-full w-full"
                        />
                    </div>
                )}
            </div>
        );
    };

    // Render Presentation layout (large screen share + small camera)
    const renderPresentationLayout = () => {
        const screenTrack = screenShareTracks[0];
        const cameraTrack = cameraTracks[0];

        return (
            <div className="flex h-full w-full gap-4">
                <div className="flex-1 relative">
                    {screenTrack ? (
                        <ParticipantTile
                            trackRef={screenTrack}
                            className="absolute inset-0 rounded-xl overflow-hidden border border-border bg-black/20"
                        />
                    ) : cameraTrack ? (
                        <ParticipantTile
                            trackRef={cameraTrack}
                            className="absolute inset-0 rounded-xl overflow-hidden border border-border bg-black/20"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground rounded-xl border border-border bg-black/20">
                            Share your screen for presentation mode
                        </div>
                    )}
                </div>
                {screenTrack && cameraTrack && (
                    <div className="w-64 flex flex-col gap-4">
                        <ParticipantTile
                            trackRef={cameraTrack}
                            className="flex-1 rounded-xl overflow-hidden border border-border bg-black/20"
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Edit Mode Toggle */}
            <div className="absolute top-6 right-6 z-20">
                <Button
                    variant={isEditMode ? "default" : "secondary"}
                    size="sm"
                    className="gap-2 rounded-xl shadow-lg"
                    onClick={() => setEditMode(!isEditMode)}
                >
                    {isEditMode ? (
                        <>
                            <Eye className="w-4 h-4" />
                            Preview
                        </>
                    ) : (
                        <>
                            <Edit className="w-4 h-4" />
                            Edit Layout
                        </>
                    )}
                </Button>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 w-full relative overflow-hidden p-4">
                <SceneCanvas
                    sources={sources}
                    onSourcesChange={onSourcesChange || (() => { })}
                    isEditing={isEditMode}
                >
                    {tracks.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Waiting for participants...
                        </div>
                    ) : activeLayout === "pip" ? (
                        renderPipLayout()
                    ) : activeLayout === "presentation" ? (
                        renderPresentationLayout()
                    ) : (
                        <div className={cn(
                            "grid gap-4 h-full w-full transition-all duration-300",
                            getLayoutClasses()
                        )}>
                            {tracks.slice(0, activeLayout === "solo" ? 1 : activeLayout === "duo" ? 2 : activeLayout === "quad" ? 4 : tracks.length).map((track) => (
                                <ParticipantTile
                                    key={track.participant.identity + track.source}
                                    trackRef={track}
                                    className="rounded-xl overflow-hidden border border-border bg-black/20"
                                />
                            ))}
                        </div>
                    )}
                </SceneCanvas>

                {/* Banner Overlay */}
                {activeBanner && (
                    <BannerOverlay activeBanner={activeBanner} />
                )}

                {/* Highlighted Chat Overlay */}
                <ChatOverlay
                    message={highlightedMessage || null}
                    position="bottom-left"
                    onDismiss={onDismissHighlight}
                />
            </div>

            {/* Bottom Control Bar */}
            <div className="shrink-0 p-4 flex justify-center w-full z-50">
                <ControlBar
                    isAudioEnabled={localParticipant.isMicrophoneEnabled}
                    isVideoEnabled={localParticipant.isCameraEnabled}
                    isScreenSharing={localParticipant.isScreenShareEnabled}
                    isLive={isLive}
                    isRecording={false} // Todo: connect to actual recording state if available
                    recordingDuration={recordingDuration}
                    onToggleAudio={() => localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)}
                    onToggleVideo={() => localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)}
                    onToggleScreenShare={toggleScreenShare}
                    onToggleRecording={() => { }} // Todo: implement recording toggle
                    onGoLive={onGoLive || (() => { })}
                    onOpenSettings={onOpenSettings}
                />
            </div>
        </div>
    );
}
