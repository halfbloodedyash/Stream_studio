"use client";

import { useState } from "react";
import { UserPlus, Link, Copy, Check, X, Users, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
        <div className="guest-management">
            <style jsx>{`
        .guest-management {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding: var(--space-3);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .count-badge {
          padding: 2px 6px;
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .waiting-section {
          padding: var(--space-3);
          background: hsla(38, 92%, 50%, 0.1);
          border: 1px solid hsla(38, 92%, 50%, 0.2);
          border-radius: var(--radius-md);
        }

        .waiting-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-warning);
          margin-bottom: var(--space-3);
        }

        .waiting-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .waiting-guest {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
        }

        .guest-avatar {
          width: 32px;
          height: 32px;
          background: var(--color-bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        .guest-name {
          flex: 1;
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }

        .guest-actions {
          display: flex;
          gap: var(--space-1);
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: none;
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-btn.admit {
          color: var(--color-success);
          border-color: var(--color-success);
        }

        .action-btn.admit:hover {
          background: var(--color-success);
          color: white;
        }

        .action-btn.deny {
          color: var(--color-error);
          border-color: var(--color-error);
        }

        .action-btn.deny:hover {
          background: var(--color-error);
          color: white;
        }

        .guest-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .guest-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-success);
        }

        .status-dot.invited {
          background: var(--color-text-muted);
        }

        .status-dot.waiting {
          background: var(--color-warning);
        }

        .invite-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-accent-secondary);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: white;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .invite-btn:hover {
          background: var(--color-accent-secondary-hover);
        }

        .invite-url-container {
          display: flex;
          gap: var(--space-2);
          margin-top: var(--space-4);
        }

        .invite-url-input {
          flex: 1;
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-family-mono);
        }

        .copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-3);
          background: var(--color-bg-hover);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .copy-btn:hover {
          background: var(--color-bg-tertiary);
        }

        .copy-btn.copied {
          background: var(--color-success);
          border-color: var(--color-success);
          color: white;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-6);
          text-align: center;
          color: var(--color-text-muted);
        }

        .empty-state p {
          font-size: var(--text-sm);
        }
      `}</style>

            {/* Invite Button */}
            {isHost && (
                <button className="invite-btn" onClick={handleInvite} disabled={isLoading}>
                    <UserPlus size={16} />
                    {isLoading ? "Generating..." : "Invite Guest"}
                </button>
            )}

            {/* Waiting Guests */}
            {waitingGuests.length > 0 && isHost && (
                <div className="waiting-section">
                    <div className="waiting-title">
                        <Users size={16} />
                        {waitingGuests.length} guest{waitingGuests.length !== 1 ? "s" : ""} waiting
                    </div>
                    <div className="waiting-list">
                        {waitingGuests.map((guest) => (
                            <div key={guest.clientId} className="waiting-guest">
                                <div className="guest-avatar">
                                    {guest.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="guest-name">{guest.name}</span>
                                <div className="guest-actions">
                                    <button
                                        className="action-btn admit"
                                        onClick={() => onAdmit(guest.clientId)}
                                        title="Admit"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        className="action-btn deny"
                                        onClick={() => onRemove(guest.clientId)}
                                        title="Deny"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Connected Guests */}
            <div>
                <div className="section-header">
                    <span className="section-title">
                        <Users size={16} />
                        Participants
                        <span className="count-badge">{guests.length}</span>
                    </span>
                </div>

                {guests.length === 0 ? (
                    <div className="empty-state">
                        <Users size={32} />
                        <p>No guests have joined yet</p>
                    </div>
                ) : (
                    <div className="guest-list">
                        {guests.map((guest) => (
                            <div key={guest.id} className="guest-card">
                                <div className="guest-avatar">
                                    {guest.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="guest-name">{guest.name}</span>
                                <span className={`status-dot ${guest.status}`} />
                                {isHost && guest.status === "connected" && (
                                    <button
                                        className="action-btn deny"
                                        onClick={() => onRemove(guest.id)}
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Invite Guest"
                size="sm"
            >
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                    Share this link with your guest to invite them to the broadcast:
                </p>
                <div className="invite-url-container">
                    <input
                        type="text"
                        className="invite-url-input"
                        value={currentInviteUrl}
                        readOnly
                    />
                    <button
                        className={`copy-btn ${copied ? "copied" : ""}`}
                        onClick={copyToClipboard}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
