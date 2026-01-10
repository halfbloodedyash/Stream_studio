"use client";

import { Check, X, Users } from "lucide-react";
import styles from "./GuestNotifications.module.css";

interface WaitingGuest {
    clientId: string;
    name: string;
}

interface GuestNotificationsProps {
    waitingGuests: WaitingGuest[];
    onAdmit: (clientId: string) => void;
    onReject: (clientId: string) => void;
}

export function GuestNotifications({
    waitingGuests,
    onAdmit,
    onReject,
}: GuestNotificationsProps) {
    if (waitingGuests.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Users size={16} />
                <span>Waiting to Join ({waitingGuests.length})</span>
            </div>
            <div className={styles.guestList}>
                {waitingGuests.map((guest) => (
                    <div key={guest.clientId} className={styles.guestItem}>
                        <div className={styles.guestAvatar}>
                            {guest.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.guestName}>{guest.name}</span>
                        <div className={styles.actions}>
                            <button
                                className={styles.admitBtn}
                                onClick={() => onAdmit(guest.clientId)}
                                title="Admit guest"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                className={styles.rejectBtn}
                                onClick={() => onReject(guest.clientId)}
                                title="Reject guest"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
