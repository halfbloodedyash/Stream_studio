"use client";

import { useState } from "react";
import {
    Youtube,
    Facebook,
    Twitch,
    Linkedin,
    Radio,
    Check,
    X,
    AlertCircle,
    Settings,
    Eye,
    EyeOff,
    Trash2,
    Plus,
    ExternalLink,
    Copy,
    RefreshCw,
} from "lucide-react";

// Platform configurations
export const PLATFORMS = {
    youtube: {
        name: "YouTube Live",
        icon: Youtube,
        color: "#ff0000",
        rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
        helpUrl: "https://studio.youtube.com/channel/UC/livestreaming",
    },
    facebook: {
        name: "Facebook Live",
        icon: Facebook,
        color: "#1877f2",
        rtmpUrl: "rtmps://live-api-s.facebook.com:443/rtmp",
        helpUrl: "https://www.facebook.com/live/producer",
    },
    twitch: {
        name: "Twitch",
        icon: Twitch,
        color: "#9146ff",
        rtmpUrl: "rtmp://live.twitch.tv/app",
        helpUrl: "https://dashboard.twitch.tv/settings/stream",
    },
    linkedin: {
        name: "LinkedIn Live",
        icon: Linkedin,
        color: "#0a66c2",
        rtmpUrl: "rtmps://prod-global-rtmp.publish.live-video.net:443/rtmp",
        helpUrl: "https://www.linkedin.com/video/golive",
    },
    custom: {
        name: "Custom RTMP",
        icon: Radio,
        color: "#6b7280",
        rtmpUrl: "",
        helpUrl: "",
    },
};

export type PlatformType = keyof typeof PLATFORMS;

export interface Destination {
    id: string;
    platform: PlatformType;
    name: string;
    rtmpUrl: string;
    streamKey: string;
    enabled: boolean;
    status: "idle" | "connecting" | "live" | "error";
    error?: string;
    stats?: StreamStats;
}

export interface StreamStats {
    viewers?: number;
    duration: number;
    bitrate: number;
    fps: number;
    droppedFrames: number;
}

// Destination Card Component
interface DestinationCardProps {
    destination: Destination;
    onToggle: (id: string) => void;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    isLive: boolean;
}

export function DestinationCard({
    destination,
    onToggle,
    onEdit,
    onRemove,
    isLive,
}: DestinationCardProps) {
    const [showKey, setShowKey] = useState(false);
    const platform = PLATFORMS[destination.platform];
    const Icon = platform.icon;

    const getStatusBadge = () => {
        switch (destination.status) {
            case "live":
                return (
                    <span className="status-badge live">
                        <span className="status-dot"></span>
                        Live
                    </span>
                );
            case "connecting":
                return (
                    <span className="status-badge connecting">
                        <RefreshCw size={12} className="spin" />
                        Connecting
                    </span>
                );
            case "error":
                return (
                    <span className="status-badge error">
                        <AlertCircle size={12} />
                        Error
                    </span>
                );
            default:
                return (
                    <span className="status-badge idle">
                        Ready
                    </span>
                );
        }
    };

    return (
        <div className={`destination-card ${destination.enabled ? "enabled" : ""}`}>
            <style jsx>{`
        .destination-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .destination-card.enabled {
          border-color: ${platform.color}40;
          background: ${platform.color}10;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .platform-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: ${platform.color}20;
          border-radius: var(--radius-md);
          color: ${platform.color};
        }

        .platform-info {
          flex: 1;
          min-width: 0;
        }

        .platform-name {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .destination-name {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .toggle-switch.enabled {
          background: var(--color-success);
          border-color: var(--color-success);
        }

        .toggle-switch::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform var(--transition-fast);
        }

        .toggle-switch.enabled::after {
          transform: translateX(20px);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
        }

        .status-badge.idle {
          background: var(--color-bg-primary);
          color: var(--color-text-secondary);
        }

        .status-badge.live {
          background: hsla(0, 84%, 55%, 0.15);
          color: var(--color-live);
        }

        .status-badge.connecting {
          background: hsla(38, 92%, 50%, 0.15);
          color: var(--color-warning);
        }

        .status-badge.error {
          background: hsla(0, 84%, 60%, 0.15);
          color: var(--color-error);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .stream-key-section {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--color-bg-primary);
          border-radius: var(--radius-sm);
        }

        .stream-key {
          flex: 1;
          font-family: var(--font-family-mono);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .key-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .key-btn:hover {
          color: var(--color-text-primary);
        }

        .stats-row {
          display: flex;
          gap: var(--space-4);
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .stat-value {
          color: var(--color-text-secondary);
          font-family: var(--font-family-mono);
        }

        .card-actions {
          display: flex;
          gap: var(--space-2);
          padding-top: var(--space-2);
          border-top: 1px solid var(--color-border-subtle);
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          background: none;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .action-btn.danger:hover {
          background: hsla(0, 84%, 55%, 0.15);
          border-color: hsla(0, 84%, 55%, 0.3);
          color: var(--color-error);
        }
      `}</style>

            <div className="card-header">
                <div className="platform-icon">
                    <Icon size={20} />
                </div>
                <div className="platform-info">
                    <div className="platform-name">{platform.name}</div>
                    <div className="destination-name">{destination.name}</div>
                </div>
                {getStatusBadge()}
                <button
                    className={`toggle-switch ${destination.enabled ? "enabled" : ""}`}
                    onClick={() => onToggle(destination.id)}
                    disabled={isLive}
                />
            </div>

            <div className="stream-key-section">
                <span className="stream-key">
                    {showKey
                        ? destination.streamKey
                        : "••••••••••••••••••••"}
                </span>
                <button
                    className="key-btn"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? "Hide" : "Show"}
                >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                    className="key-btn"
                    onClick={() => navigator.clipboard.writeText(destination.streamKey)}
                    title="Copy"
                >
                    <Copy size={14} />
                </button>
            </div>

            {destination.status === "live" && destination.stats && (
                <div className="stats-row">
                    <span className="stat">
                        Bitrate: <span className="stat-value">{destination.stats.bitrate} kbps</span>
                    </span>
                    <span className="stat">
                        FPS: <span className="stat-value">{destination.stats.fps}</span>
                    </span>
                    <span className="stat">
                        Dropped: <span className="stat-value">{destination.stats.droppedFrames}</span>
                    </span>
                </div>
            )}

            {destination.error && (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-error)" }}>
                    {destination.error}
                </div>
            )}

            <div className="card-actions">
                <button className="action-btn" onClick={() => onEdit(destination.id)}>
                    <Settings size={12} />
                    Edit
                </button>
                {platform.helpUrl && (
                    <a
                        href={platform.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn"
                    >
                        <ExternalLink size={12} />
                        Get Key
                    </a>
                )}
                <button className="action-btn danger" onClick={() => onRemove(destination.id)}>
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

// Add Destination Modal
interface AddDestinationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (destination: Omit<Destination, "id" | "status" | "stats">) => void;
}

export function AddDestinationModal({
    isOpen,
    onClose,
    onAdd,
}: AddDestinationModalProps) {
    const [platform, setPlatform] = useState<PlatformType>("youtube");
    const [name, setName] = useState("");
    const [rtmpUrl, setRtmpUrl] = useState("");
    const [streamKey, setStreamKey] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            platform,
            name: name || PLATFORMS[platform].name,
            rtmpUrl: platform === "custom" ? rtmpUrl : PLATFORMS[platform].rtmpUrl,
            streamKey,
            enabled: true,
        });
        onClose();
        // Reset form
        setName("");
        setRtmpUrl("");
        setStreamKey("");
        setPlatform("youtube");
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);
          animation: fadeIn 0.2s ease;
        }

        .modal {
          width: 100%;
          max-width: 480px;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .modal-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .close-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .modal-body {
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .platform-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-2);
        }

        .platform-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .platform-option:hover {
          background: var(--color-bg-hover);
        }

        .platform-option.selected {
          border-color: var(--color-accent-secondary);
          background: hsla(217, 91%, 60%, 0.1);
        }

        .platform-option span {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }

        .form-input {
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          transition: all var(--transition-fast);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-accent-secondary);
          box-shadow: 0 0 0 3px hsla(217, 91%, 60%, 0.2);
        }

        .form-input::placeholder {
          color: var(--color-text-muted);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--color-border-subtle);
        }

        .btn {
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-secondary {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          color: var(--color-text-primary);
        }

        .btn-secondary:hover {
          background: var(--color-bg-hover);
        }

        .btn-primary {
          background: var(--color-accent-secondary);
          border: none;
          color: white;
        }

        .btn-primary:hover {
          background: var(--color-accent-secondary-hover);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Add Streaming Destination</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Platform</label>
                            <div className="platform-grid">
                                {(Object.entries(PLATFORMS) as [PlatformType, typeof PLATFORMS.youtube][]).map(
                                    ([key, value]) => {
                                        const Icon = value.icon;
                                        return (
                                            <button
                                                type="button"
                                                key={key}
                                                className={`platform-option ${platform === key ? "selected" : ""}`}
                                                onClick={() => setPlatform(key)}
                                                style={{ color: value.color }}
                                            >
                                                <Icon size={24} />
                                                <span>{value.name}</span>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Display Name (optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={PLATFORMS[platform].name}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {platform === "custom" && (
                            <div className="form-group">
                                <label className="form-label">RTMP URL</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="rtmp://your-server.com/live"
                                    value={rtmpUrl}
                                    onChange={(e) => setRtmpUrl(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Stream Key</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your stream key"
                                value={streamKey}
                                onChange={(e) => setStreamKey(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!streamKey || (platform === "custom" && !rtmpUrl)}
                        >
                            Add Destination
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Destinations Panel
interface DestinationsPanelProps {
    destinations: Destination[];
    isLive: boolean;
    onToggle: (id: string) => void;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    onAdd: (destination: Omit<Destination, "id" | "status" | "stats">) => void;
}

export function DestinationsPanel({
    destinations,
    isLive,
    onToggle,
    onEdit,
    onRemove,
    onAdd,
}: DestinationsPanelProps) {
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <div className="destinations-panel">
            <style jsx>{`
        .destinations-panel {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-3);
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel-title {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          background: var(--color-accent-secondary);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .add-btn:hover {
          background: var(--color-accent-secondary-hover);
        }

        .destinations-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-8);
          text-align: center;
          color: var(--color-text-muted);
        }

        .empty-state p {
          font-size: var(--text-sm);
        }
      `}</style>

            <div className="panel-header">
                <span className="panel-title">Streaming Destinations</span>
                <button className="add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={14} />
                    Add
                </button>
            </div>

            <div className="destinations-list">
                {destinations.length === 0 ? (
                    <div className="empty-state">
                        <Radio size={32} />
                        <p>No destinations configured</p>
                        <button className="add-btn" onClick={() => setShowAddModal(true)}>
                            <Plus size={14} />
                            Add Destination
                        </button>
                    </div>
                ) : (
                    destinations.map((dest) => (
                        <DestinationCard
                            key={dest.id}
                            destination={dest}
                            isLive={isLive}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onRemove={onRemove}
                        />
                    ))
                )}
            </div>

            <AddDestinationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={onAdd}
            />
        </div>
    );
}
