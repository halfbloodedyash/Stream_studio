"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Move, Maximize2, X, Camera, Monitor, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DraggableSourceProps {
    id: string;
    type: "camera" | "screen" | "image" | "video";
    position: Position;
    isSelected: boolean;
    children: React.ReactNode;
    onSelect: (id: string) => void;
    onPositionChange: (id: string, position: Position) => void;
    onDelete: (id: string) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export function DraggableSource({
    id,
    type,
    position,
    isSelected,
    children,
    onSelect,
    onPositionChange,
    onDelete,
    containerRef,
}: DraggableSourceProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
    const dragStartRef = useRef<{ x: number; y: number; position: Position } | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    const getTypeIcon = () => {
        switch (type) {
            case "camera": return <Camera className="w-3 h-3" />;
            case "screen": return <Monitor className="w-3 h-3" />;
            case "image": return <Image className="w-3 h-3" />;
            default: return <Camera className="w-3 h-3" />;
        }
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(id);

        if ((e.target as HTMLElement).closest('.resize-handle')) return;

        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            position: { ...position },
        };
    }, [id, onSelect, position]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
        e.stopPropagation();
        onSelect(id);
        setIsResizing(true);
        setResizeHandle(handle);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            position: { ...position },
        };
    }, [id, onSelect, position]);

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStartRef.current || !containerRef.current) return;

            const container = containerRef.current.getBoundingClientRect();
            const deltaX = ((e.clientX - dragStartRef.current.x) / container.width) * 100;
            const deltaY = ((e.clientY - dragStartRef.current.y) / container.height) * 100;

            if (isDragging) {
                const newX = Math.max(0, Math.min(100 - position.width, dragStartRef.current.position.x + deltaX));
                const newY = Math.max(0, Math.min(100 - position.height, dragStartRef.current.position.y + deltaY));

                onPositionChange(id, {
                    ...position,
                    x: newX,
                    y: newY,
                });
            } else if (isResizing && resizeHandle) {
                let newPos = { ...dragStartRef.current.position };

                // Handle horizontal resize
                if (resizeHandle.includes("e")) {
                    newPos.width = Math.max(10, dragStartRef.current.position.width + deltaX);
                }
                if (resizeHandle.includes("w")) {
                    const widthDelta = -deltaX;
                    newPos.x = Math.max(0, dragStartRef.current.position.x - widthDelta);
                    newPos.width = Math.max(10, dragStartRef.current.position.width + widthDelta);
                }

                // Handle vertical resize
                if (resizeHandle.includes("s")) {
                    newPos.height = Math.max(10, dragStartRef.current.position.height + deltaY);
                }
                if (resizeHandle.includes("n")) {
                    const heightDelta = -deltaY;
                    newPos.y = Math.max(0, dragStartRef.current.position.y - heightDelta);
                    newPos.height = Math.max(10, dragStartRef.current.position.height + heightDelta);
                }

                // Clamp to container bounds
                newPos.width = Math.min(newPos.width, 100 - newPos.x);
                newPos.height = Math.min(newPos.height, 100 - newPos.y);

                onPositionChange(id, newPos);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
            dragStartRef.current = null;
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, isResizing, resizeHandle, id, position, onPositionChange, containerRef]);

    const resizeHandles: { handle: ResizeHandle; className: string }[] = [
        { handle: "nw", className: "top-0 left-0 cursor-nw-resize" },
        { handle: "ne", className: "top-0 right-0 cursor-ne-resize" },
        { handle: "sw", className: "bottom-0 left-0 cursor-sw-resize" },
        { handle: "se", className: "bottom-0 right-0 cursor-se-resize" },
        { handle: "n", className: "top-0 left-1/2 -translate-x-1/2 cursor-n-resize" },
        { handle: "s", className: "bottom-0 left-1/2 -translate-x-1/2 cursor-s-resize" },
        { handle: "e", className: "top-1/2 right-0 -translate-y-1/2 cursor-e-resize" },
        { handle: "w", className: "top-1/2 left-0 -translate-y-1/2 cursor-w-resize" },
    ];

    return (
        <div
            ref={elementRef}
            className={cn(
                "absolute group transition-shadow",
                isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20",
                isDragging && "cursor-grabbing opacity-80",
                !isDragging && !isResizing && "cursor-grab"
            )}
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `${position.width}%`,
                height: `${position.height}%`,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Source content */}
            <div className="absolute inset-0 rounded-xl overflow-hidden border border-border/50 bg-black/20">
                {children}
            </div>

            {/* Selection UI */}
            {isSelected && (
                <>
                    {/* Type badge */}
                    <div className="absolute -top-7 left-0 flex items-center gap-1.5 bg-primary text-primary-foreground px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-lg">
                        {getTypeIcon()}
                        {type}
                    </div>

                    {/* Control buttons */}
                    <div className="absolute -top-7 right-0 flex gap-1">
                        <button
                            className="p-1 bg-secondary hover:bg-secondary/80 rounded-md transition-colors shadow-lg"
                            title="Move"
                        >
                            <Move className="w-3 h-3" />
                        </button>
                        <button
                            className="p-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-md transition-colors shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(id);
                            }}
                            title="Remove"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Resize handles */}
                    {resizeHandles.map(({ handle, className }) => (
                        <div
                            key={handle}
                            className={cn(
                                "resize-handle absolute w-3 h-3 bg-primary border-2 border-white rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity",
                                className
                            )}
                            onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
