"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Video,
  Clock,
  Users,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Play,
  Calendar,
  Activity,
  Signal
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useToastStore } from "@/stores/toastStore";
import { BackgroundEffects } from "@/components/ui/BackgroundEffects";

interface Room {
  id: string;
  title: string;
  status: "draft" | "live" | "ended";
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participantCount: number;
}

// Mock data for demo - ensures safe defaults
const MOCK_ROOMS: Room[] = [
  {
    id: "abc123",
    title: "Weekly Team Standup",
    status: "draft",
    createdAt: new Date().toISOString(),
    participantCount: 0,
  },
];

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        // Fallback to mock data if API fails or returns empty in dev
        try {
          const response = await apiClient.rooms.list();
          if (response.rooms) {
            setRooms(response.rooms);
          } else {
            setRooms([]);
          }
        } catch (e) {
          console.warn("Using mock data due to API error", e);
          setRooms(MOCK_ROOMS);
        }
      } catch (error: any) {
        addToast(`Failed to load broadcasts: ${error.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [addToast]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown Date";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: Room["status"]) => {
    switch (status) {
      case "live":
        return (
          <span className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-sm text-[10px] font-tech font-bold uppercase tracking-wider text-red-500">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            Live
          </span>
        );
      case "ended":
        return <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-sm text-[10px] font-tech font-bold uppercase tracking-wider text-zinc-400">Archived</span>;
      default:
        return <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-sm text-[10px] font-tech font-bold uppercase tracking-wider text-blue-400">Ready</span>;
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await apiClient.rooms.create({
        title: "Untitled Broadcast",
        description: "New broadcast session",
      });
      setRooms([response.room, ...rooms]);
      addToast("Broadcast created", "success");
    } catch (error: any) {
      addToast(`Failed to create broadcast: ${error.message}`, "error");
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await apiClient.rooms.delete(id);
      setRooms(rooms.filter((r) => r.id !== id));
      addToast("Broadcast deleted", "info");
    } catch (error: any) {
      addToast(`Failed to delete broadcast: ${error.message}`, "error");
    } finally {
      setActiveMenu(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && !(event.target as Element).closest('button[data-menu-trigger]') && !(event.target as Element).closest('div[data-menu-content]')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  return (
    <div className="min-h-screen p-8 relative">
      <BackgroundEffects />

      {/* Decorative header line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20 pointer-events-none" />

      <header className="flex items-center justify-between mb-12 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-primary/50 font-tech text-xs uppercase mb-1 tracking-widest">
            <Activity size={12} />
            <span>Control Center // Unit 01</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-tight">
            My Broadcasts
          </h1>
        </div>
        <button
          className="bg-primary hover:bg-[#ff4d1f] text-black font-bold py-3 px-5 uppercase font-tech tracking-wider flex items-center gap-2 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_rgba(255,255,255,0.1)] clip-path-slant"
          onClick={handleCreateRoom}
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
          <Plus size={18} />
          <span>New Operation</span>
        </button>
      </header>

      {rooms.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-center border border-dashed border-[#333] bg-[#0a0a0a]/50 rounded-lg relative z-10">
          <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-6 text-zinc-700">
            <Video size={32} />
          </div>
          <h2 className="text-xl font-display text-white mb-2 uppercase">Signal Lost</h2>
          <p className="text-zinc-500 font-tech text-sm max-w-sm mb-8">
            No active transmission signals detected. Initialize a new broadcast to begin streaming.
          </p>
          <button
            className="px-6 py-3 border border-[#333] hover:border-primary text-zinc-400 hover:text-primary font-tech uppercase tracking-wider text-sm transition-all"
            onClick={handleCreateRoom}
          >
            Initialize Broadcast
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {rooms.map((room) => (
            <div key={room.id} className="group bg-[#0a0a0a] border border-[#222] hover:border-primary/50 transition-all duration-300 flex flex-col relative overflow-hidden">
              {/* Card scanning line effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none" />

              <div className="aspect-video bg-[#050505] relative border-b border-[#222] group-hover:border-primary/30 transition-colors">
                <div className="absolute inset-0 flex items-center justify-center text-[#222] group-hover:text-primary/20 transition-colors">
                  <Signal size={48} />
                </div>
                <div className="absolute top-3 left-3">
                  {getStatusBadge(room.status)}
                </div>

                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4 relative">
                  <h3 className="text-lg font-bold text-white leading-tight font-display tracking-wide group-hover:text-primary transition-colors">
                    {room.title || "Untitled Operation"}
                  </h3>

                  <div className="relative">
                    <button
                      data-menu-trigger
                      className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-[#222] transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === room.id ? null : room.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenu === room.id && (
                      <div data-menu-content className="absolute right-0 top-full mt-1 min-w-[160px] bg-[#111] border border-[#333] z-20 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                        <div className="py-1">
                          <button className="w-full text-left px-4 py-2 text-xs font-tech uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-[#222] flex items-center gap-2">
                            <Edit size={12} /> Rename
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-xs font-tech uppercase tracking-wider text-red-500/80 hover:text-red-500 hover:bg-red-950/20 flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoom(room.id);
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2 text-[11px] font-tech text-zinc-500 uppercase tracking-wider">
                    <Calendar size={12} />
                    <span>{formatDate(room.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-tech text-zinc-500 uppercase tracking-wider">
                    <Users size={12} />
                    <span>{room.participantCount || 0} Operators</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#222] group-hover:border-primary/20 transition-colors">
                  <Link
                    href={`/studio/${room.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-2 px-4 text-xs font-bold uppercase font-tech tracking-wider transition-all border ${room.status === 'draft'
                        ? 'bg-[#111] border-[#333] text-zinc-300 hover:bg-[#1a1a1a] hover:border-zinc-500'
                        : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-black'
                      }`}
                  >
                    <Play size={12} />
                    {room.status === "draft" ? "Enter Studio" : "View Monitor"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
