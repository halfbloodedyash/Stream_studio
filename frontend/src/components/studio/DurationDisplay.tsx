"use client";

import { useState, useEffect, memo } from "react";

interface DurationDisplayProps {
    startTime: number;
    isActive: boolean;
    className?: string;
}

/**
 * Self-contained duration display component that manages its own 1-second updates.
 * This isolates the timer re-renders from the parent component tree.
 */
export const DurationDisplay = memo(function DurationDisplay({
    startTime,
    isActive,
    className = ""
}: DurationDisplayProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setElapsed(0);
            return;
        }

        // Calculate initial elapsed time
        setElapsed(Math.floor((Date.now() - startTime) / 1000));

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, startTime]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (!isActive) return null;

    return <span className={className}>{formatDuration(elapsed)}</span>;
});
