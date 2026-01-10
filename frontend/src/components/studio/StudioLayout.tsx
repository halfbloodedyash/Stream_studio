"use client";

import { useLocalParticipant, useTracks, ParticipantTile, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import { ControlBar } from "./ControlBar";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LayoutType } from "@/lib/types/layouts";
import { BannerOverlay, BannerData } from "./BannerOverlay";

interface StudioLayoutProps {
    onOpenSettings?: () => void;
    onGoLive?: () => void;
    isLive?: boolean;
    recordingDuration?: string;
    activeBanner?: BannerData | null;
}

export function StudioLayout({
    onOpenSettings,
    onGoLive,
    isLive = false,
    recordingDuration,
    activeBanner
}: StudioLayoutProps) {
    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext();

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

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Main Video Area */}
            <div className="flex-1 w-full relative overflow-hidden p-4">
                {tracks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Waiting for participants...
                    </div>
                ) : (
                    <div className={cn(
                        "grid gap-4 h-full w-full transition-all duration-300",
                        tracks.length === 1 ? "grid-cols-1" :
                            tracks.length === 2 ? "grid-cols-2" :
                                "grid-cols-2 md:grid-cols-3"
                    )}>
                        {tracks.map((track) => (
                            <ParticipantTile
                                key={track.participant.identity + track.source}
                                trackRef={track}
                                className="rounded-xl overflow-hidden border border-border bg-black/20"
                            />
                        ))}
                    </div>
                )}

                {/* Banner Overlay */}
                {activeBanner && (
                    <BannerOverlay activeBanner={activeBanner} />
                )}
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
