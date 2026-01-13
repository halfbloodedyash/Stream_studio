"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Camera, Monitor, Image, Trash2, Layers } from "lucide-react";
import { DraggableSource } from "./DraggableSource";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Source } from "@/stores/studioStore";

interface SceneCanvasProps {
    sources: Source[];
    onSourcesChange: (sources: Source[]) => void;
    isEditing?: boolean;
    children?: React.ReactNode; // For rendering video tracks
}

export function SceneCanvas({
    sources,
    onSourcesChange,
    isEditing = false,
    children,
}: SceneCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

    const handleAddSource = useCallback((type: Source["type"]) => {
        const newSource: Source = {
            id: `source-${Date.now()}`,
            type,
            position: {
                x: 25,
                y: 25,
                width: 50,
                height: 50,
            },
        };
        onSourcesChange([...sources, newSource]);
        setSelectedSourceId(newSource.id);
    }, [sources, onSourcesChange]);

    const handlePositionChange = useCallback((id: string, position: Source["position"]) => {
        const updated = sources.map(s =>
            s.id === id ? { ...s, position } : s
        );
        onSourcesChange(updated);
    }, [sources, onSourcesChange]);

    const handleDeleteSource = useCallback((id: string) => {
        onSourcesChange(sources.filter(s => s.id !== id));
        if (selectedSourceId === id) {
            setSelectedSourceId(null);
        }
    }, [sources, onSourcesChange, selectedSourceId]);

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSelectedSourceId(null);
        }
    }, []);

    const renderSourceContent = (source: Source) => {
        switch (source.type) {
            case "camera":
                return (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-primary/5">
                        <Camera className="w-8 h-8 text-primary/50" />
                    </div>
                );
            case "screen":
                return (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                        <Monitor className="w-8 h-8 text-blue-500/50" />
                    </div>
                );
            case "image":
                return (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-amber-500/20 to-amber-500/5">
                        <Image className="w-8 h-8 text-amber-500/50" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative h-full w-full">
            {/* Canvas area */}
            <div
                ref={containerRef}
                className={cn(
                    "relative h-full w-full rounded-xl overflow-hidden",
                    isEditing && "ring-2 ring-primary/30 ring-dashed"
                )}
                onClick={handleCanvasClick}
            >
                {/* Background content (video tracks) */}
                <div className="absolute inset-0">
                    {children}
                </div>

                {/* Draggable sources overlay */}
                {isEditing && sources.map((source) => (
                    <DraggableSource
                        key={source.id}
                        id={source.id}
                        type={source.type}
                        position={source.position}
                        isSelected={selectedSourceId === source.id}
                        onSelect={setSelectedSourceId}
                        onPositionChange={handlePositionChange}
                        onDelete={handleDeleteSource}
                        containerRef={containerRef as React.RefObject<HTMLDivElement>}
                    >
                        {renderSourceContent(source)}
                    </DraggableSource>
                ))}
            </div>

            {/* Edit mode toolbar */}
            {isEditing && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-2xl z-20">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
                                <Plus className="w-4 h-4" />
                                Add Source
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48 rounded-xl">
                            <DropdownMenuItem
                                className="gap-2 rounded-lg"
                                onClick={() => handleAddSource("camera")}
                            >
                                <Camera className="w-4 h-4 text-primary" />
                                Camera
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 rounded-lg"
                                onClick={() => handleAddSource("screen")}
                            >
                                <Monitor className="w-4 h-4 text-blue-500" />
                                Screen Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 rounded-lg"
                                onClick={() => handleAddSource("image")}
                            >
                                <Image className="w-4 h-4 text-amber-500" />
                                Image Overlay
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {selectedSourceId && (
                        <>
                            <div className="w-px h-6 bg-border" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteSource(selectedSourceId)}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                        </>
                    )}

                    <div className="w-px h-6 bg-border" />

                    <div className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
                        <Layers className="w-3 h-3" />
                        {sources.length} source{sources.length !== 1 ? "s" : ""}
                    </div>
                </div>
            )}
        </div>
    );
}
