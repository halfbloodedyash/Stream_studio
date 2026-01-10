import { useState } from "react";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    Radio,
    Circle,
    Settings,
    MoreVertical,
    Wifi,
    RotateCcw,
} from "lucide-react";
import { BackgroundEffects } from "@/components/ui/BackgroundEffects";

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
        <div className="flex items-center justify-center p-3 gap-3 bg-[#111] border border-[#333] rounded-2xl shadow-2xl relative z-10 backdrop-blur-md">
            {/* Main Controls */}
            <div className="flex items-center gap-2">
                {/* Microphone */}
                <button
                    className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all ${isAudioEnabled
                            ? "bg-[#222] border-[#333] text-zinc-200 hover:bg-[#333] hover:border-zinc-600"
                            : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                        }`}
                    onClick={onToggleAudio}
                    title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                    {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                {/* Camera */}
                <button
                    className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all ${isVideoEnabled
                            ? "bg-[#222] border-[#333] text-zinc-200 hover:bg-[#333] hover:border-zinc-600"
                            : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                        }`}
                    onClick={onToggleVideo}
                    title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                    {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                {/* Screen Share */}
                <button
                    className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all ${isScreenSharing
                            ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(255,51,0,0.3)]"
                            : "bg-[#222] border-[#333] text-zinc-200 hover:bg-[#333] hover:border-zinc-600"
                        }`}
                    onClick={onToggleScreenShare}
                    title="Share screen"
                >
                    <MonitorUp size={20} />
                </button>
            </div>

            <div className="w-px h-8 bg-[#333] mx-1" />

            {/* Recording */}
            <div className="flex items-center gap-2">
                <button
                    className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all ${isRecording
                            ? "bg-red-500/10 border-red-500/30 text-red-500"
                            : "bg-[#222] border-[#333] text-zinc-200 hover:bg-[#333] hover:border-zinc-600"
                        }`}
                    onClick={onToggleRecording}
                    title={isRecording ? "Stop recording" : "Start recording"}
                >
                    <Circle
                        size={20}
                        fill={isRecording ? "currentColor" : "none"}
                    />
                </button>
                {isRecording && (
                    <span className="font-tech text-xs font-bold text-red-500 animate-pulse">{recordingDuration}</span>
                )}
            </div>

            <div className="w-px h-8 bg-[#333] mx-1" />

            {/* Go Live Button */}
            <button
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase font-tech tracking-wider border transition-all ${isLive
                        ? "bg-red-600 border-red-500 text-white animate-live-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                        : "bg-primary hover:bg-[#ff4d1f] text-black border-primary border-b-4 border-b-[#cc2900] active:border-b-0 active:translate-y-1"
                    }`}
                onClick={onGoLive}
            >
                <Radio size={18} />
                {isLive ? "End Stream" : "Go Live"}
            </button>

            <div className="w-px h-8 bg-[#333] mx-1" />

            {/* Destinations & Settings */}
            <div className="flex items-center gap-2 relative">
                <button
                    className="flex items-center justify-center w-11 h-11 rounded-xl border border-[#333] bg-[#222] text-zinc-200 hover:bg-[#333] hover:border-zinc-600 transition-all"
                    title="Stream Destinations"
                    onClick={onOpenDestinations}
                >
                    <Wifi size={20} />
                </button>
                <button
                    className="flex items-center justify-center w-11 h-11 rounded-xl border border-[#333] bg-[#222] text-zinc-200 hover:bg-[#333] hover:border-zinc-600 transition-all"
                    title="Settings"
                    onClick={onOpenSettings}
                >
                    <Settings size={20} />
                </button>

                {/* More Menu */}
                <div className="relative">
                    <button
                        className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all ${showMore
                                ? "bg-[#333] border-zinc-600 text-white"
                                : "bg-[#222] border-[#333] text-zinc-200 hover:bg-[#333] hover:border-zinc-600"
                            }`}
                        title="More options"
                        onClick={() => setShowMore(!showMore)}
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showMore && (
                        <div className="absolute bottom-full right-0 mb-2 min-w-[180px] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100" onClick={() => setShowMore(false)}>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-xs font-tech font-bold uppercase text-zinc-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors text-left">
                                <Settings size={14} />
                                <span>Advanced Settings</span>
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-xs font-tech font-bold uppercase text-zinc-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors text-left">
                                <RotateCcw size={14} />
                                <span>Reset Layout</span>
                            </button>
                            <div className="h-px bg-[#333] my-1" />
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-xs font-tech font-bold uppercase text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                                <span>Disconnect</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
