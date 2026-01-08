"use client";

import { useState } from "react";
import { Wifi, Plus, Youtube, Twitch } from "lucide-react";
import styles from "./DestinationsPanel.module.css";

interface Destination {
    id: string;
    platform: "youtube" | "twitch" | "facebook" | "custom";
    name: string;
    status: "idle" | "connecting" | "live" | "error";
}

export function DestinationsPanel() {
    const [destinations, setDestinations] = useState<Destination[]>([]);

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case "youtube":
                return <Youtube size={20} />;
            case "twitch":
                return <Twitch size={20} />;
            default:
                return <Wifi size={20} />;
        }
    };

    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case "youtube":
                return "#FF0000";
            case "twitch":
                return "#9146FF";
            case "facebook":
                return "#1877F2";
            default:
                return "var(--color-accent-primary)";
        }
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <button className={styles.addBtn}>
                    <Plus size={16} />
                    Add Destination
                </button>
            </div>

            {destinations.length === 0 ? (
                <div className={styles.emptyState}>
                    <Wifi size={48} />
                    <h4>No Destinations</h4>
                    <p>Add streaming platforms like YouTube, Twitch, or Facebook.</p>
                </div>
            ) : (
                <div className={styles.destinationList}>
                    {destinations.map((dest) => (
                        <div key={dest.id} className={styles.destination}>
                            <div
                                className={styles.icon}
                                style={{ background: getPlatformColor(dest.platform) }}
                            >
                                {getPlatformIcon(dest.platform)}
                            </div>
                            <div className={styles.info}>
                                <div className={styles.name}>{dest.name}</div>
                                <div className={styles.status}>{dest.status}</div>
                            </div>
                            <div className={styles.statusIndicator} data-status={dest.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
