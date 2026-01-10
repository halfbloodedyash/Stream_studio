"use client";

import { useState } from "react";
import { Mic, Users, MessageSquare, Send, Smile, Paperclip, MoreHorizontal, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  platform?: "youtube" | "twitch" | "facebook";
  isSystem?: boolean;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      user: "You",
      text: inputText,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header handled by parent or optionally here */}

      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col gap-4 py-6">
          {messages.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-700">
              <div className="bg-secondary/30 p-6 rounded-full border border-border/40">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold tracking-tight">No Comments Yet</h4>
                <p className="text-[11px] text-muted-foreground/60 max-w-[200px] leading-relaxed">
                  Connect your stream to see comments from YouTube, Twitch, and more.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex flex-col gap-1 anime-in slide-in-from-bottom-2 duration-300",
                msg.user === "You" ? "items-end" : "items-start"
              )}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {msg.user}
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground/40">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={cn(
                  "relative px-4 py-2.5 rounded-2xl text-xs font-medium max-w-[85%] shadow-sm border",
                  msg.user === "You"
                    ? "bg-primary text-white border-primary/20 rounded-tr-none"
                    : "bg-secondary/40 text-foreground/90 border-border/40 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-secondary/20 border-t border-border/40 shadow-inner">
        <form onSubmit={handleSend} className="relative flex items-center gap-1.5 bg-card border border-border/60 rounded-2xl p-1.5 shadow-sm group focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
          <Button variant="ghost" size="icon" type="button" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-secondary transition-all">
            <Smile className="w-4 h-4" />
          </Button>

          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Talk to your audience..."
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 h-9 text-xs px-2"
          />

          <Button
            type="submit"
            disabled={!inputText.trim()}
            className={cn(
              "h-9 w-9 rounded-xl transition-all",
              inputText.trim() ? "bg-primary text-white shadow-md active:scale-90" : "bg-muted text-muted-foreground opacity-50"
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>

        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex gap-1">
            <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-black tracking-widest bg-muted/20 border-border/20 text-muted-foreground/60">
              CHAT READY
            </Badge>
          </div>
          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">0 Participants</span>
        </div>
      </div>
    </div>
  );
}
