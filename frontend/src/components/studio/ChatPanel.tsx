"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Youtube,
  Send,
  Smile,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Star,
  Crown,
  Shield,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useToastStore } from "@/stores/toastStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export interface ChatMessage {
  id: string;
  authorName: string;
  authorPhoto?: string;
  message: string;
  timestamp: Date;
  platform: "youtube" | "twitch" | "facebook" | "local";
  isModerator?: boolean;
  isOwner?: boolean;
  isMember?: boolean;
  superChatAmount?: string;
}

interface Broadcast {
  id: string;
  title: string;
  liveChatId: string;
  status: string;
  concurrentViewers?: number;
}

interface ChatPanelProps {
  roomId?: string;
  onHighlightMessage?: (message: ChatMessage) => void;
}

export function ChatPanel({ roomId, onHighlightMessage }: ChatPanelProps) {
  // YouTube connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [channelInfo, setChannelInfo] = useState<{ title: string; thumbnail: string } | null>(null);

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { addToast } = useToastStore();

  // Check YouTube connection status on mount
  useEffect(() => {
    checkConnectionStatus();

    // Listen for OAuth popup completion
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "youtube-connected") {
        if (event.data.success) {
          addToast("YouTube connected successfully!", "success");
          checkConnectionStatus();
        } else {
          addToast(`YouTube connection failed: ${event.data.error}`, "error");
        }
        setIsConnecting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/youtube/status`, {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const data = await response.json();

      setIsConnected(data.connected);
      if (data.channel) {
        setChannelInfo(data.channel);
      }

      // If connected, fetch broadcasts
      if (data.connected) {
        fetchBroadcasts();
      }
    } catch (error) {
      console.error("[CHAT] Failed to check connection:", error);
    }
  };

  const connectYouTube = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/youtube/auth`, {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const data = await response.json();

      // Open OAuth in a popup window instead of redirecting
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        "YouTube OAuth",
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Poll to check if popup was closed without completing
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          // Give a moment for the message to arrive
          setTimeout(() => {
            setIsConnecting(false);
          }, 1000);
        }
      }, 500);

    } catch (error) {
      console.error("[CHAT] Failed to initiate connection:", error);
      addToast("Failed to connect to YouTube", "error");
      setIsConnecting(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/youtube/disconnect`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      setIsConnected(false);
      setChannelInfo(null);
      setBroadcasts([]);
      setSelectedBroadcast(null);
      setMessages([]);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      addToast("Disconnected from YouTube", "info");
    } catch (error) {
      console.error("[CHAT] Failed to disconnect:", error);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/youtube/broadcasts`, {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const data = await response.json();

      setBroadcasts([...data.active, ...data.upcoming]);

      // Auto-select the first active broadcast
      if (data.active.length > 0 && !selectedBroadcast) {
        selectBroadcast(data.active[0]);
      }
    } catch (error) {
      console.error("[CHAT] Failed to fetch broadcasts:", error);
    }
  };

  const selectBroadcast = (broadcast: Broadcast) => {
    setSelectedBroadcast(broadcast);
    setMessages([]);

    // Start polling for messages
    if (broadcast.liveChatId) {
      startPolling(broadcast.liveChatId);
    }
  };

  const startPolling = (liveChatId: string) => {
    // Clear existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chat/youtube/messages/${liveChatId}?maxResults=50`,
          {
            credentials: "include",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        );
        const data = await response.json();

        if (data.messages) {
          setMessages(prev => {
            // Merge new messages, avoiding duplicates
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = data.messages
              .filter((m: ChatMessage) => !existingIds.has(m.id))
              .map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }));
            return [...prev, ...newMessages];
          });
        }

        // YouTube specifies the polling interval
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        pollingRef.current = setInterval(fetchMessages, data.pollingIntervalMs || 5000);

      } catch (error) {
        console.error("[CHAT] Error fetching messages:", error);
      }
    };

    // Initial fetch
    fetchMessages();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // If connected to YouTube and have a broadcast, send to YouTube
    if (selectedBroadcast?.liveChatId) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chat/youtube/messages/${selectedBroadcast.liveChatId}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: inputText }),
          }
        );
      } catch (error) {
        console.error("[CHAT] Failed to send message:", error);
      }
    }

    // Add to local messages
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      authorName: "You",
      message: inputText,
      timestamp: new Date(),
      platform: "local",
      isOwner: true,
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
  };

  const handleHighlight = async (msg: ChatMessage) => {
    if (onHighlightMessage) {
      onHighlightMessage(msg);
    }

    // Also send to backend for persistence (useful for OBS browser sources)
    if (roomId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/highlight`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId,
            message: {
              id: msg.id,
              authorName: msg.authorName,
              authorPhoto: msg.authorPhoto,
              message: msg.message,
              platform: msg.platform,
              isModerator: msg.isModerator,
              isOwner: msg.isOwner,
            },
            duration: 10000,
          }),
        });
      } catch (error) {
        console.error("[CHAT] Failed to highlight:", error);
      }
    }

    addToast("Message highlighted!", "success");
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* YouTube Connection Banner */}
      {!isConnected ? (
        <div className="p-4 bg-gradient-to-r from-red-500/10 to-red-500/5 border-b border-red-500/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Connect YouTube</h4>
                <p className="text-[10px] text-muted-foreground">
                  Display live chat on your stream
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={connectYouTube}
              disabled={isConnecting}
              className="h-8 px-3 text-xs font-bold bg-red-600 hover:bg-red-700"
            >
              {isConnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-gradient-to-r from-green-500/10 to-green-500/5 border-b border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-bold text-green-600">
                {channelInfo?.title || "YouTube Connected"}
              </span>
              {selectedBroadcast && (
                <Badge variant="outline" className="h-5 text-[9px] bg-red-500/10 border-red-500/30 text-red-500">
                  <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnectYouTube}
              className="h-6 text-[10px] text-muted-foreground hover:text-destructive"
            >
              Disconnect
            </Button>
          </div>

          {/* Broadcast selector */}
          {broadcasts.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {broadcasts.map(b => (
                <Button
                  key={b.id}
                  variant={selectedBroadcast?.id === b.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectBroadcast(b)}
                  className="h-6 text-[10px] px-2"
                >
                  {b.title.substring(0, 20)}
                  {b.title.length > 20 ? "..." : ""}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
              <div className="bg-secondary/30 p-5 rounded-full border border-border/40">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold tracking-tight">No Messages Yet</h4>
                <p className="text-[11px] text-muted-foreground/60 max-w-[200px] leading-relaxed">
                  {isConnected
                    ? "Waiting for chat messages from YouTube..."
                    : "Connect YouTube to see live chat"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="group flex gap-3 hover:bg-muted/20 p-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => handleHighlight(msg)}
              >
                {/* Author Photo */}
                {msg.authorPhoto ? (
                  <img
                    src={msg.authorPhoto}
                    alt={msg.authorName}
                    className="w-8 h-8 rounded-full border border-border/40 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-primary/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {msg.authorName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Author name + badges */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-foreground truncate">
                      {msg.authorName}
                    </span>
                    {msg.isOwner && (
                      <Crown className="w-3 h-3 text-amber-400" />
                    )}
                    {msg.isModerator && (
                      <Shield className="w-3 h-3 text-blue-400" />
                    )}
                    {msg.isMember && (
                      <Star className="w-3 h-3 text-green-400" />
                    )}
                    {msg.platform === "youtube" && (
                      <Youtube className="w-3 h-3 text-red-500" />
                    )}
                    {msg.superChatAmount && (
                      <Badge className="h-4 text-[8px] bg-amber-500 text-black px-1.5">
                        {msg.superChatAmount}
                      </Badge>
                    )}
                  </div>

                  {/* Message text */}
                  <p className="text-xs text-foreground/80 leading-relaxed break-words">
                    {msg.message}
                  </p>

                  {/* Timestamp */}
                  <span className="text-[9px] text-muted-foreground/50 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Highlight button (visible on hover) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHighlight(msg);
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs">Show on stream</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-secondary/20 border-t border-border/40">
        <form onSubmit={handleSend} className="relative flex items-center gap-1.5 bg-card border border-border/60 rounded-2xl p-1.5 shadow-sm group focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
          <Button variant="ghost" size="icon" type="button" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-secondary transition-all">
            <Smile className="w-4 h-4" />
          </Button>

          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isConnected ? "Send to YouTube chat..." : "Type a message..."}
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 h-9 text-xs px-2"
          />

          <Button
            type="submit"
            disabled={!inputText.trim()}
            className={cn(
              "h-9 w-9 rounded-xl transition-all",
              inputText.trim()
                ? "bg-primary text-white shadow-md active:scale-90"
                : "bg-muted text-muted-foreground opacity-50"
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>

        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex gap-1">
            {isConnected ? (
              <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-black tracking-widest bg-green-500/10 border-green-500/20 text-green-500">
                YOUTUBE CONNECTED
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-black tracking-widest bg-muted/20 border-border/20 text-muted-foreground/60">
                CHAT READY
              </Badge>
            )}
          </div>
          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
            {messages.length} Messages
          </span>
        </div>
      </div>
    </div>
  );
}
