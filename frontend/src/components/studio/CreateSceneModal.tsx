"use client";

import { useState } from "react";
import { X, Layers, Users, Monitor, Grid3X3, Check, LayoutGrid, Plus } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CreateSceneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (scene: { name: string; layout: any }) => void;
}

type LayoutType = "solo" | "duo" | "trio" | "quad" | "grid" | "pip" | "sidebar";

interface LayoutOption {
    id: LayoutType;
    name: string;
    description: string;
    icon: React.ReactNode;
    preview: React.ReactNode;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
    {
        id: "solo",
        name: "Solo",
        description: "Single participant",
        icon: <Users size={16} />,
        preview: (
            <div className="grid grid-cols-1 w-full h-full p-2 gap-1 bg-secondary/20 rounded-lg overflow-hidden border border-border/40">
                <div className="bg-primary/20 rounded-md ring-1 ring-primary/20 shadow-inner" />
            </div>
        ),
    },
    {
        id: "duo",
        name: "Side by Side",
        description: "Two split evenly",
        icon: <LayoutGrid size={16} />,
        preview: (
            <div className="grid grid-cols-2 w-full h-full p-2 gap-1.5 bg-secondary/20 rounded-lg overflow-hidden border border-border/40 text-background">
                <div className="bg-primary/20 rounded-md ring-1 ring-primary/20" />
                <div className="bg-primary/20 rounded-md ring-1 ring-primary/20" />
            </div>
        ),
    },
    {
        id: "pip",
        name: "Overlay",
        description: "Main with overlay",
        icon: <Monitor size={16} />,
        preview: (
            <div className="relative w-full h-full p-2 bg-secondary/20 rounded-lg overflow-hidden border border-border/40">
                <div className="w-full h-full bg-primary/20 rounded-md ring-1 ring-primary/20" />
                <div className="absolute bottom-3 right-3 w-1/3 h-1/4 bg-primary/40 rounded shadow-md border border-white/10" />
            </div>
        ),
    },
    {
        id: "grid",
        name: "Grid",
        description: "Equal grid layout",
        icon: <Grid3X3 size={16} />,
        preview: (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-2 gap-1 bg-secondary/20 rounded-lg overflow-hidden border border-border/40">
                <div className="bg-primary/20 rounded-md ring-1 ring-primary/20" />
                <div className="bg-primary/20 rounded-md ring-1 ring-primary/20" />
                <div className="bg-primary/20 rounded-md ring-1 ring-primary/20" />
                <div className="bg-primary/20 rounded-md ring-1 ring-primary/20" />
            </div>
        ),
    },
];

export function CreateSceneModal({ isOpen, onClose, onCreate }: CreateSceneModalProps) {
    const [sceneName, setSceneName] = useState("");
    const [selectedLayout, setSelectedLayout] = useState<LayoutType>("solo");

    const handleCreate = () => {
        if (!sceneName.trim()) return;
        onCreate({
            name: sceneName.trim(),
            layout: selectedLayout,
        });
        setSceneName("");
        setSelectedLayout("solo");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            />

            <Card className="relative w-full max-w-xl bg-card border-border/60 shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex flex-col h-[580px] max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-secondary/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Layers className="w-5 h-5 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-bold tracking-tight">Create New Scene</h2>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Define a new broadcast layout</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                        {/* Scene Name */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Scene Name</Label>
                            <Input
                                className="h-12 rounded-2xl bg-secondary/20 border-border/40 text-base focus:ring-primary/20"
                                placeholder="e.g. Intro Scene, Gaming Layout..."
                                value={sceneName}
                                onChange={(e) => setSceneName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <Separator className="bg-border/40" />

                        {/* Layout Selection */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Choose Layout</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {LAYOUT_OPTIONS.map((layout) => (
                                    <button
                                        key={layout.id}
                                        className={cn(
                                            "group relative flex flex-col gap-3 p-3 rounded-2xl border transition-all text-left overflow-hidden",
                                            selectedLayout === layout.id
                                                ? "bg-primary/5 border-primary/40 ring-1 ring-primary/40 shadow-lg shadow-primary/5"
                                                : "bg-secondary/10 border-border/40 hover:bg-secondary/20 hover:border-border/60"
                                        )}
                                        onClick={() => setSelectedLayout(layout.id)}
                                    >
                                        <div className="aspect-video relative overflow-hidden rounded-lg bg-card/60 ring-1 ring-border/20 transition-transform group-hover:scale-[1.02]">
                                            {layout.preview}
                                        </div>

                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-xs font-bold leading-tight",
                                                    selectedLayout === layout.id ? "text-primary" : "text-foreground/80"
                                                )}>{layout.name}</span>
                                                <span className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-tight">{layout.description}</span>
                                            </div>
                                            {selectedLayout === layout.id && (
                                                <div className="bg-primary text-white p-1 rounded-full shadow-sm">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-secondary/10 border-t border-border/40 flex justify-end gap-3 shadow-inner">
                        <Button variant="outline" onClick={onClose} className="rounded-xl px-8 h-11 font-bold">Cancel</Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!sceneName.trim()}
                            className="rounded-xl px-10 h-11 font-bold shadow-lg shadow-primary/10 gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create Scene
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
