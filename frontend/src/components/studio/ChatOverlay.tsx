"use client";

import { useState, useEffect } from "react";
import { Youtube, Crown, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface HighlightedMessage {
    id: string;
    authorName: string;
    authorPhoto?: string;
    message: string;
    platform: "youtube" | "twitch" | "facebook" | "local";
    isModerator?: boolean;
    isOwner?: boolean;
    isMember?: boolean;
    expiresAt?: number;
}

interface ChatOverlayProps {
    message: HighlightedMessage | null;
    position?: "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right";
    onDismiss?: () => void;
}

export function ChatOverlay({ message, position = "bottom-left", onDismiss }: ChatOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (message) {
            setIsExiting(false);
            // Small delay for enter animation
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsExiting(true);
            const timeout = setTimeout(() => {
                setIsVisible(false);
                setIsExiting(false);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [message]);

    if (!message && !isVisible) return null;

    const positionClasses = {
        "bottom-left": "bottom-8 left-8",
        "bottom-right": "bottom-8 right-8",
        "bottom-center": "bottom-8 left-1/2 -translate-x-1/2",
        "top-left": "top-8 left-8",
        "top-right": "top-8 right-8",
    };

    const getPlatformIcon = () => {
        switch (message?.platform) {
            case "youtube":
                return <Youtube className="w-4 h-4 text-red-500" />;
            default:
                return <Youtube className="w-4 h-4 text-red-500" />;
        }
    };

    const getPlatformColor = () => {
        switch (message?.platform) {
            case "youtube":
                return "border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent";
            case "twitch":
                return "border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent";
            case "facebook":
                return "border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-transparent";
            default:
                return "border-primary/30";
        }
    };

    return (
        <div
            className={cn(
                "absolute z-50 max-w-md transition-all duration-300 ease-out",
                positionClasses[position],
                isVisible && !isExiting
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-4 scale-95"
            )}
        >
            <div
                className={cn(
                    "relative backdrop-blur-xl rounded-2xl border-2 p-4 shadow-2xl",
                    "bg-black/80",
                    getPlatformColor()
                )}
            >
                {/* Dismiss button */}
                {onDismiss && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 border border-white/10"
                        onClick={onDismiss}
                    >
                        <X className="w-3 h-3 text-white/60" />
                    </Button>
                )}

                {/* Header with author info */}
                <div className="flex items-center gap-3 mb-3">
                    {/* Author photo */}
                    {message?.authorPhoto ? (
                        <img
                            src={message.authorPhoto}
                            alt={message.authorName}
                            className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {message?.authorName?.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm truncate">
                                {message?.authorName}
                            </span>

                            {/* Badges */}
                            {message?.isOwner && (
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            {message?.isModerator && (
                                <Shield className="w-3.5 h-3.5 text-blue-400" />
                            )}
                        </div>

                        {/* Platform indicator */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {getPlatformIcon()}
                            <span className="text-[10px] text-white/50 uppercase font-medium tracking-wider">
                                {message?.platform} Chat
                            </span>
                        </div>
                    </div>
                </div>

                {/* Message content */}
                <div className="text-white/90 text-base leading-relaxed font-medium">
                    "{message?.message}"
                </div>

                {/* Animated progress bar showing remaining time */}
                {message?.expiresAt && (
                    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 ease-linear"
                            style={{
                                width: `${Math.max(0, ((message.expiresAt - Date.now()) / 10000) * 100)}%`,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
