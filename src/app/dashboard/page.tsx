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
} from "lucide-react";

interface Room {
  id: string;
  title: string;
  status: "draft" | "live" | "ended";
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participantCount: number;
}

// Mock data for demo
const MOCK_ROOMS: Room[] = [
  {
    id: "abc123",
    title: "Weekly Team Standup",
    status: "draft",
    createdAt: new Date().toISOString(),
    participantCount: 0,
  },
  {
    id: "def456",
    title: "Product Launch Event",
    status: "ended",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    endedAt: new Date(Date.now() - 82800000).toISOString(),
    participantCount: 5,
  },
];

import { apiClient } from "@/lib/api/client";
import { useToastStore } from "@/stores/toastStore";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.rooms.list();
        setRooms(response.rooms);
      } catch (error: any) {
        addToast(`Failed to load broadcasts: ${error.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [addToast]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: Room["status"]) => {
    switch (status) {
      case "live":
        return (
          <span className="status-badge live">
            <span className="status-dot"></span>
            Live
          </span>
        );
      case "ended":
        return <span className="status-badge ended">Ended</span>;
      default:
        return <span className="status-badge draft">Draft</span>;
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

  return (
    <div className="dashboard">
      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: var(--color-bg-primary);
          padding: var(--space-8);
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-8);
        }

        .dashboard-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--color-text-primary);
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-5);
          background: var(--color-accent-primary);
          border: none;
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: hsl(142, 71%, 8%);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .create-btn:hover {
          background: var(--color-accent-primary-hover);
          transform: translateY(-1px);
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-4);
        }

        .room-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all var(--transition-fast);
        }

        .room-card:hover {
          border-color: var(--color-border-default);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .room-thumbnail {
          aspect-ratio: 16 / 9;
          background: linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .room-thumbnail svg {
          color: var(--color-text-muted);
          opacity: 0.5;
        }

        .room-status {
          position: absolute;
          top: var(--space-3);
          left: var(--space-3);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
        }

        .status-badge.draft {
          background: var(--color-bg-tertiary);
          color: var(--color-text-secondary);
        }

        .status-badge.live {
          background: hsla(0, 84%, 55%, 0.15);
          color: var(--color-live);
        }

        .status-badge.ended {
          background: hsla(217, 91%, 60%, 0.15);
          color: var(--color-accent-secondary);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .room-content {
          padding: var(--space-4);
        }

        .room-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .room-title {
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
          line-height: 1.3;
        }

        .menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .menu-btn:hover {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .menu-dropdown {
          position: absolute;
          right: var(--space-3);
          top: 100%;
          margin-top: var(--space-1);
          min-width: 150px;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 10;
          overflow: hidden;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          width: 100%;
          padding: var(--space-2) var(--space-3);
          background: none;
          border: none;
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          cursor: pointer;
          text-align: left;
          transition: background var(--transition-fast);
        }

        .menu-item:hover {
          background: var(--color-bg-tertiary);
        }

        .menu-item.danger {
          color: var(--color-error);
        }

        .room-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-4);
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .room-actions {
          display: flex;
          gap: var(--space-2);
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
        }

        .room-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-2);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .room-action-btn:hover {
          background: var(--color-bg-hover);
          border-color: var(--color-border-default);
        }

        .room-action-btn.primary {
          background: var(--color-accent-secondary);
          border-color: var(--color-accent-secondary);
          color: white;
        }

        .room-action-btn.primary:hover {
          background: var(--color-accent-secondary-hover);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-16);
          text-align: center;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: var(--color-bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        .empty-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .empty-description {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          max-width: 300px;
        }
      `}</style>

      <div className="dashboard-header">
        <h1 className="dashboard-title">My Broadcasts</h1>
        <button className="create-btn" onClick={handleCreateRoom}>
          <Plus size={18} />
          New Broadcast
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Video size={32} />
          </div>
          <h2 className="empty-title">No broadcasts yet</h2>
          <p className="empty-description">
            Create your first broadcast to start streaming to your audience.
          </p>
          <button className="create-btn" onClick={handleCreateRoom}>
            <Plus size={18} />
            Create Broadcast
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-thumbnail">
                <Video size={48} />
                <div className="room-status">{getStatusBadge(room.status)}</div>
              </div>
              <div className="room-content">
                <div className="room-header" style={{ position: "relative" }}>
                  <h3 className="room-title">{room.title}</h3>
                  <button
                    className="menu-btn"
                    onClick={() => setActiveMenu(activeMenu === room.id ? null : room.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === room.id && (
                    <div className="menu-dropdown">
                      <button className="menu-item">
                        <Edit size={14} />
                        Rename
                      </button>
                      <button
                        className="menu-item danger"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="room-meta">
                  <span className="meta-item">
                    <Calendar size={12} />
                    {formatDate(room.createdAt)}
                  </span>
                  <span className="meta-item">
                    <Users size={12} />
                    {room.participantCount} participants
                  </span>
                  {(room as any).settings?.lastRecording && (
                    <span className="meta-item" style={{ color: "var(--color-error)" }}>
                      <Clock size={12} />
                      Recordings available
                    </span>
                  )}
                </div>
                <div className="room-actions">
                  <Link href={`/studio/${room.id}`} className="room-action-btn primary">
                    <Play size={14} />
                    {room.status === "draft" ? "Enter Studio" : "View"}
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
