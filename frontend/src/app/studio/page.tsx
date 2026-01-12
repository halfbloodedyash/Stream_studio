"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Youtube, Loader2 } from "lucide-react";

/**
 * /studio page - Handles YouTube OAuth callback
 * Opens in a popup window and communicates success/failure to the parent window
 */
export default function StudioCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const youtubeConnected = searchParams.get("youtube_connected");
        const youtubeError = searchParams.get("youtube_error");

        if (youtubeConnected === "true") {
            setStatus("success");
            setMessage("YouTube connected successfully!");

            // Notify parent window if this is a popup
            if (window.opener) {
                window.opener.postMessage({ type: "youtube-connected", success: true }, "*");
            }

            // Always redirect to dashboard after delay
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                } else {
                    router.push("/dashboard");
                }
            }, 2000);
        } else if (youtubeError) {
            setStatus("error");
            setMessage(`Connection failed: ${youtubeError}`);

            // Notify parent window if this is a popup
            if (window.opener) {
                window.opener.postMessage({ type: "youtube-connected", success: false, error: youtubeError }, "*");
            }

            // Always redirect to dashboard after delay
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                } else {
                    router.push("/dashboard");
                }
            }, 3000);
        } else {
            // No query params - redirect to dashboard immediately
            router.push("/dashboard");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-xl p-8 text-center">
                {/* YouTube Logo */}
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${status === "success" ? "bg-green-500/20" :
                    status === "error" ? "bg-red-500/20" :
                        "bg-red-500/20"
                    }`}>
                    {status === "loading" ? (
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    ) : status === "success" ? (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                    )}
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold mb-2">
                    {status === "loading" ? "Connecting..." :
                        status === "success" ? "Connected!" :
                            "Connection Failed"}
                </h1>

                {/* Message */}
                <p className="text-muted-foreground text-sm mb-6">
                    {status === "loading" ? "Completing YouTube authorization..." : message}
                </p>

                {/* YouTube badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span>YouTube Live Chat</span>
                </div>

                {/* Auto-close message */}
                {status !== "loading" && (
                    <p className="text-xs text-muted-foreground/60 mt-4">
                        This window will close automatically...
                    </p>
                )}
            </div>
        </div>
    );
}
