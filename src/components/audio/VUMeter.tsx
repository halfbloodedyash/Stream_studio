"use client";

import { useRef, useEffect, useState } from "react";

interface VUMeterProps {
    level: number; // 0-100
    orientation?: "vertical" | "horizontal";
    size?: "small" | "medium" | "large";
    showPeak?: boolean;
    peakHoldTime?: number;
    className?: string;
}

export function VUMeter({
    level,
    orientation = "vertical",
    size = "medium",
    showPeak = true,
    peakHoldTime = 1500,
    className = "",
}: VUMeterProps) {
    const [peakLevel, setPeakLevel] = useState(0);
    const peakTimeoutRef = useRef<NodeJS.Timeout>();

    // Update peak hold
    useEffect(() => {
        if (level > peakLevel) {
            setPeakLevel(level);
            if (peakTimeoutRef.current) {
                clearTimeout(peakTimeoutRef.current);
            }
            peakTimeoutRef.current = setTimeout(() => {
                setPeakLevel(0);
            }, peakHoldTime);
        }
        return () => {
            if (peakTimeoutRef.current) {
                clearTimeout(peakTimeoutRef.current);
            }
        };
    }, [level, peakLevel, peakHoldTime]);

    const getColor = (value: number) => {
        if (value > 90) return "var(--color-error)";
        if (value > 75) return "var(--color-warning)";
        return "var(--color-success)";
    };

    const getSizeStyles = () => {
        switch (size) {
            case "small":
                return orientation === "vertical"
                    ? { width: "4px", height: "32px" }
                    : { width: "48px", height: "4px" };
            case "large":
                return orientation === "vertical"
                    ? { width: "8px", height: "80px" }
                    : { width: "120px", height: "8px" };
            default:
                return orientation === "vertical"
                    ? { width: "6px", height: "48px" }
                    : { width: "80px", height: "6px" };
        }
    };

    const sizeStyles = getSizeStyles();
    const isVertical = orientation === "vertical";

    return (
        <div
            className={`vu-meter ${className}`}
            style={{
                position: "relative",
                ...sizeStyles,
                background: "var(--color-bg-tertiary)",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
            }}
        >
            {/* Level bar */}
            <div
                style={{
                    position: "absolute",
                    bottom: isVertical ? 0 : undefined,
                    left: isVertical ? 0 : 0,
                    right: isVertical ? 0 : undefined,
                    top: isVertical ? undefined : 0,
                    [isVertical ? "height" : "width"]: `${level}%`,
                    [isVertical ? "width" : "height"]: "100%",
                    background: `linear-gradient(${isVertical ? "to top" : "to right"}, 
            var(--color-success) 0%, 
            var(--color-success) 60%, 
            var(--color-warning) 75%, 
            var(--color-error) 100%)`,
                    borderRadius: "var(--radius-full)",
                    transition: "height 50ms ease-out, width 50ms ease-out",
                }}
            />

            {/* Peak indicator */}
            {showPeak && peakLevel > 0 && (
                <div
                    style={{
                        position: "absolute",
                        [isVertical ? "bottom" : "left"]: `${peakLevel}%`,
                        [isVertical ? "left" : "top"]: 0,
                        [isVertical ? "right" : "bottom"]: 0,
                        [isVertical ? "height" : "width"]: "2px",
                        [isVertical ? "width" : "height"]: "100%",
                        background: getColor(peakLevel),
                        transform: isVertical ? "translateY(50%)" : "translateX(-50%)",
                    }}
                />
            )}
        </div>
    );
}

// Stereo VU Meter (left + right channels)
interface StereoVUMeterProps {
    leftLevel: number;
    rightLevel: number;
    size?: "small" | "medium" | "large";
    className?: string;
}

export function StereoVUMeter({
    leftLevel,
    rightLevel,
    size = "medium",
    className = "",
}: StereoVUMeterProps) {
    return (
        <div
            className={`stereo-vu-meter ${className}`}
            style={{
                display: "flex",
                gap: "2px",
                alignItems: "flex-end",
            }}
        >
            <VUMeter level={leftLevel} size={size} />
            <VUMeter level={rightLevel} size={size} />
        </div>
    );
}
