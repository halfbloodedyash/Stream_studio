"use client";

import { useState } from "react";
import { UserPlus, Link, Copy, Check, X, Users, Trash2, ShieldCheck, UserMinus, UserCheck, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal"; // Keep for now or use shadcn Dialog
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Guest {
  id: string;
  name: string;
  status: "invited" | "waiting" | "connected";
  joinedAt?: string;
}

interface GuestManagementProps {
  guests: Guest[];
  waitingGuests: Array<{ clientId: string; name: string }>;
  inviteUrl?: string;
  onInvite: () => Promise<string>;
  onAdmit: (guestId: string) => void;
  onRemove: (guestId: string) => void;
  isHost: boolean;
}

export function GuestManagement({
  guests,
  waitingGuests,
  inviteUrl,
  onInvite,
  onAdmit,
  onRemove,
  isHost,
}: GuestManagementProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentInviteUrl, setCurrentInviteUrl] = useState(inviteUrl || "");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    setIsLoading(true);
    try {
      const url = await onInvite();
      setCurrentInviteUrl(url);
      setShowInviteModal(true);
    } catch (error) {
      console.error("Failed to generate invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Invite Button Section */}
      {isHost && (
        <section className="space-y-4">
          <Button
            onClick={handleInvite}
            disabled={isLoading}
            className="w-full h-12 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            {isLoading ? "Generating Link..." : "Invite Guest"}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
            Invite up to 10 guests to join your broadcast
          </p>
        </section>
      )}

      {/* Waiting Guests Section */}
      {waitingGuests.length > 0 && isHost && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
              <Users className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-500/80">Lobby Waiting</h3>
            <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 h-5 text-[10px] font-black">
              {waitingGuests.length}
            </Badge>
          </div>

          <div className="grid gap-2">
            {waitingGuests.map((guest) => (
              <Card key={guest.clientId} className="p-3 bg-amber-500/5 border-amber-500/20 rounded-xl flex items-center gap-3 group animate-in slide-in-from-right-2 duration-300">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black shrink-0 shadow-sm">
                  {guest.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold truncate">{guest.name}</p>
                  <p className="text-[9px] text-amber-600/60 font-medium uppercase">Waiting for host</p>
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                    onClick={() => onAdmit(guest.clientId)}
                    title="Admit"
                  >
                    <UserCheck className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20"
                    onClick={() => onRemove(guest.clientId)}
                    title="Deny"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Connected Participants Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Participants</h3>
          <Badge variant="secondary" className="ml-auto bg-muted/50 text-foreground px-1.5 h-5 text-[10px] font-black">
            {guests.length}
          </Badge>
        </div>

        {guests.length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 bg-secondary/5 text-center">
            <div className="bg-muted/10 p-4 rounded-full">
              <Users className="w-6 h-6 text-muted-foreground/20" />
            </div>
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter">Broadcast currently empty</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {guests.map((guest) => (
              <Card key={guest.id} className={cn(
                "p-3 bg-secondary/30 border-border/40 rounded-xl flex items-center gap-3 group transition-all",
                guest.status === "connected" && "bg-card border-primary/10"
              )}>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground font-black shrink-0 text-sm">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  {guest.status === "connected" && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card ring-2 ring-emerald-500/10" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{guest.name}</p>
                  <div className="flex items-center gap-1.5">
                    {guest.id === 'host' && <Badge className="px-1.5 h-4 text-[8px] uppercase tracking-tighter bg-primary/20 text-primary border-none font-black">Host</Badge>}
                    <span className={cn(
                      "text-[9px] font-medium uppercase tracking-tight",
                      guest.status === "connected" ? "text-emerald-500/80" : "text-muted-foreground/40"
                    )}>
                      {guest.status}
                    </span>
                  </div>
                </div>

                {isHost && guest.status === "connected" && guest.id !== 'host' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    onClick={() => onRemove(guest.id)}
                    title="Remove Guest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Invite Modal Overlay */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Guest"
        size="sm"
      >
        <div className="space-y-6 pt-2">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="bg-primary/10 p-4 rounded-full">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold">Invite a Guest</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anyone with the link can request to join your studio. You'll need to admit them before they go live.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Input
                type="text"
                className="h-12 pl-4 pr-12 rounded-xl bg-secondary/30 border-border/40 font-mono text-xs focus:ring-primary/20 pr-12"
                value={currentInviteUrl}
                readOnly
              />
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "absolute right-1 top-1 h-10 w-10 rounded-lg transition-all",
                  copied ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20" : "text-primary hover:bg-primary/10"
                )}
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 shadow-sm" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setShowInviteModal(false)}>Close</Button>
              <Button className="flex-1 h-11 rounded-xl font-bold gap-2" onClick={copyToClipboard}>
                <ExternalLink className="w-4 h-4" /> Share Link
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
