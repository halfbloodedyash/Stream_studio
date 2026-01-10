"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  LogOut,
  Monitor
} from "lucide-react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import apiClient from "@/lib/api/client";
import { signalingClient } from "@/lib/api/signaling";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

// Inner component that uses useSearchParams
function JoinPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = params.code as string;
  const guestName = searchParams.get("name") || "Guest";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Connection states
  const [connectionState, setConnectionState] = useState<"initial" | "connecting" | "waiting" | "admitted" | "joined" | "rejected">("initial");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize preview media
  useEffect(() => {
    initializeMedia();
    return () => {
      // Clean up stream tracks on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      // Disconnect signaling on unmount
      signalingClient.disconnect();
    };
  }, []);

  // Signaling Event Listeners
  useEffect(() => {
    const onConnect = () => {
      console.log("Connected to signaling server");
    };

    const onWaitingRoom = (payload: any) => {
      console.log("Joined waiting room", payload);
      setConnectionState("waiting");
    };

    const onAdmitted = async (payload: any) => {
      console.log("Admitted to room!", payload);
      setConnectionState("admitted");

      try {
        // Fetch real LiveKit token now that we are admitted
        // We use the same guest token endpoint, but typically backend would verify admission session
        // For this implementation, we just fetch it.
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/livekit/guest-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: roomCode, participantName: guestName }),
        });

        if (!response.ok) throw new Error("Failed to get joining token");

        const data = await response.json();
        setToken(data.token);

        // Stop preview stream before handing over to LiveKit
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        setConnectionState("joined");
      } catch (e: any) {
        setError("Failed to connect to broadcast: " + e.message);
        setConnectionState("initial");
      }
    };

    const onRemoved = (payload: any) => {
      console.log("Removed/Rejected from room", payload);
      setConnectionState("rejected");
      signalingClient.disconnect();
    };

    const onError = (err: any) => {
      console.error("Signaling error", err);
      // If we are waiting, connection error might mean lost connection
    };

    signalingClient.on("connect", onConnect);
    signalingClient.on("waiting-room", onWaitingRoom);
    signalingClient.on("admitted", onAdmitted);
    signalingClient.on("removed", onRemoved);
    signalingClient.on("error", onError);

    return () => {
      signalingClient.off("connect", onConnect);
      signalingClient.off("waiting-room", onWaitingRoom);
      signalingClient.off("admitted", onAdmitted);
      signalingClient.off("removed", onRemoved);
      signalingClient.off("error", onError);
    };
  }, [roomCode, guestName, stream]);

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

  const handleJoinRequest = () => {
    setConnectionState("connecting");
    if (!signalingClient.getClientId()) {
      signalingClient.connect();
      // Give it a moment to connect or wait for 'connect' event ideally
      // But for simplicity in this flow, we'll wait 500ms
      setTimeout(() => {
        signalingClient.send("join-room", {
          roomId: roomCode,
          name: guestName
        });
      }, 500);
    } else {
      signalingClient.send("join-room", {
        roomId: roomCode,
        name: guestName
      });
    }
  };

  const handleCancel = () => {
    signalingClient.send("leave-room");
    signalingClient.disconnect();
    setConnectionState("initial");
    // Re-init media if we cancelled
    initializeMedia();
    router.push("/");
  };

  // Render Joined State (LiveKit)
  if (connectionState === "joined" && token) {
    return (
      <div className="h-screen bg-[--color-bg-primary]">
        <LiveKitRoom
          token={token}
          serverUrl={LIVEKIT_URL}
          connect={true}
          video={true}
          audio={true}
          onDisconnected={() => {
            setConnectionState("initial");
            router.push("/");
          }}
          style={{ height: "100%" }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  // Render Rejected State
  if (connectionState === "rejected") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[--color-bg-primary] p-8">
        <div className="w-full max-w-md bg-[--color-bg-secondary] border border-[--color-border-subtle] rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <LogOut className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-[--color-text-secondary] text-sm">
              The host has declined your request to join this broadcast.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-[--color-bg-tertiary] hover:bg-[--color-bg-hover] text-white rounded-xl font-medium transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Render Waiting Room State
  if (connectionState === "waiting") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[--color-bg-primary] p-8">
        <div className="w-full max-w-md bg-[--color-bg-secondary] border border-[--color-border-subtle] rounded-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[--color-accent-primary] border-t-transparent animate-spin opacity-50"></div>
            <div className="absolute inset-2 bg-[--color-accent-primary]/10 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-[--color-accent-primary]" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">Waiting for Host</h2>
            <p className="text-[--color-text-secondary] text-sm">
              You've knocked on the door. Please wait for the host to admit you into the broadcast.
            </p>
          </div>

          <div className="bg-[--color-bg-deep] rounded-xl p-4 border border-[--color-border-subtle]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--color-bg-tertiary] flex items-center justify-center">
                <Monitor size={20} className="text-[--color-text-muted]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[--color-text-muted] uppercase">Broadcaster</div>
                <div className="text-sm font-bold text-white">Room {roomCode}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="text-sm text-[--color-error] hover:text-[--color-error]/80 font-medium transition-colors"
          >
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  // Initial / Preview State
  return (
    <div className="flex items-center justify-center min-h-screen bg-[--color-bg-primary] p-8">
      <div className="w-full max-w-[560px] bg-[--color-bg-secondary] border border-[--color-border-subtle] rounded-2xl overflow-hidden shadow-2xl">
        {/* Card Header */}
        <div className="p-6 text-center border-b border-[--color-border-subtle]">
          <h1 className="text-xl font-bold text-[--color-text-primary] mb-2">Join Broadcast</h1>
          <p className="text-sm text-[--color-text-secondary]">Room: {roomCode}</p>
        </div>

        {/* Preview Section */}
        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-[--color-error] text-sm">
              <AlertCircle size={16} />
              {error}
              <button className="ml-auto bg-transparent border-none text-[--color-error] cursor-pointer" onClick={initializeMedia}>
                <RefreshCw size={16} />
              </button>
            </div>
          )}

          {/* Video Preview */}
          <div className="relative aspect-video bg-[--color-bg-tertiary] rounded-xl overflow-hidden border border-[--color-border-default]">
            {isVideoEnabled && stream ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[--color-text-muted]">
                <VideoOff size={48} />
                <span>Camera Off</span>
              </div>
            )}

            {/* Overlay Info */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-2 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-bold text-white">{guestName}</span>
            </div>

            {/* Mic Indicator */}
            <div className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/5">
              {isAudioEnabled ? <Mic size={14} className="text-white" /> : <MicOff size={14} className="text-red-500" />}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-all cursor-pointer ${isAudioEnabled
                ? "bg-[--color-bg-tertiary] border-[--color-border-default] text-[--color-text-primary] hover:bg-[--color-bg-hover]"
                : "bg-red-500/15 border-red-500/30 text-[--color-error]"
                }`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-all cursor-pointer ${isVideoEnabled
                ? "bg-[--color-bg-tertiary] border-[--color-border-default] text-[--color-text-primary] hover:bg-[--color-bg-hover]"
                : "bg-red-500/15 border-red-500/30 text-[--color-error]"
                }`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-6 border-t border-[--color-border-subtle]">
          <button
            className="flex items-center justify-center gap-2 w-full py-4 bg-[--color-accent-primary] hover:bg-[--color-accent-primary]/90 border-none rounded-xl text-base font-bold text-[hsl(142,71%,8%)] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
            onClick={handleJoinRequest}
            disabled={!stream || !!error || connectionState === "connecting"}
          >
            {connectionState === "connecting" ? (
              <>Knocking...</>
            ) : (
              <>
                <Check size={20} />
                Request to Join
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-[--color-text-muted] mt-3 uppercase tracking-wider font-bold">
            Host approval required to enter
          </p>
        </div>
      </div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[--color-bg-primary] text-[--color-text-muted]">
      Loading...
    </div>
  );
}

// Main export with Suspense for useSearchParams
export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JoinPageContent />
    </Suspense>
  );
}
