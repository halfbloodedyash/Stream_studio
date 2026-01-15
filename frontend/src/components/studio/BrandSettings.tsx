"use client";

import { useRef } from "react";
import { Palette, Upload, Image as ImageIcon, Type, Layout, Video, Play, Trash2, Plus, Check } from "lucide-react";
import { useBrandingStore, Clip } from "@/stores/brandingStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function BrandSettings() {
    const {
        primaryColor,
        logo,
        background,
        clips,
        activeClipId,
        setPrimaryColor,
        setFontFamily,
        setLogo,
        setBackground,
        addClip,
        removeClip,
        setActiveClip,
    } = useBrandingStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const clipInputRef = useRef<HTMLInputElement>(null);

    const colors = [
        "#2dd4bf", // Teal
        "#3b82f6", // Blue
        "#8b5cf6", // Purple
        "#ec4899", // Pink
        "#ef4444", // Red
        "#f59e0b", // Amber
        "#10b981", // Emerald
        "#6366f1", // Indigo
    ];

    const handleFileUpload = (type: "logo" | "background" | "clip", e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);

        if (type === "logo") {
            setLogo({ url });
        } else if (type === "background") {
            setBackground({ url });
        } else if (type === "clip") {
            const newClip: Clip = {
                id: `clip-${Date.now()}`,
                name: file.name,
                url: url,
                type: "clip",
            };
            addClip(newClip);
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Brand Color Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    <Palette className="w-4 h-4 text-primary" />
                    <span>Colors</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {colors.map((color) => (
                        <button
                            key={color}
                            className={cn(
                                "relative flex items-center justify-center w-full aspect-square rounded-full border-2 border-transparent transition-all hover:scale-110",
                                primaryColor === color && "border-primary ring-2 ring-primary/20 scale-110"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setPrimaryColor(color)}
                        >
                            {primaryColor === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                        </button>
                    ))}
                    <div className="relative group aspect-square">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div
                            className="w-full h-full rounded-full border-2 border-border/40 bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center group-hover:border-primary/40 transition-all"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Plus className="w-4 h-4 opacity-50 text-white" />
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="bg-border/40" />

            {/* Font Family Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    <Type className="w-4 h-4 text-primary" />
                    <span>Fonts</span>
                </div>
                <Select onValueChange={setFontFamily} defaultValue="Inter">
                    <SelectTrigger className="w-full rounded-xl bg-secondary/30 border-border/60">
                        <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 shadow-xl">
                        <SelectItem value="Inter">Inter (Sans-serif)</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Playfair Display">Playfair (Serif)</SelectItem>
                    </SelectContent>
                </Select>
            </section>

            <Separator className="bg-border/40" />

            {/* Assets Section: Logo & Background */}
            <section className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        <Upload className="w-4 h-4 text-primary" />
                        <span>Logo & Background</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Site Logo</Label>
                            <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload("logo", e)} accept="image/*" className="hidden" />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "relative aspect-[3/1] rounded-xl border-2 border-dashed border-border/40 bg-secondary/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-secondary/40 hover:border-primary/20 overflow-hidden group",
                                    logo.url && "border-solid border-primary/20 bg-card"
                                )}
                            >
                                {logo.url ? (
                                    <>
                                        <img src={logo.url} alt="Logo" className="max-h-[70%] max-w-[80%] object-contain drop-shadow-md" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0"
                                            onClick={(e) => { e.stopPropagation(); setLogo({ url: "" }); }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                                        <span className="text-xs text-muted-foreground/60 font-medium">Upload PNG/SVG</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Background Upload */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Video Background</Label>
                            <input type="file" ref={bgInputRef} onChange={(e) => handleFileUpload("background", e)} accept="image/*" className="hidden" />
                            <div
                                onClick={() => bgInputRef.current?.click()}
                                className={cn(
                                    "relative aspect-video rounded-xl border-2 border-dashed border-border/40 bg-secondary/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-secondary/40 hover:border-primary/20 overflow-hidden group",
                                    background.url && "border-solid border-primary/20 bg-card"
                                )}
                            >
                                {background.url ? (
                                    <>
                                        <img src={background.url} alt="Background" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0"
                                            onClick={(e) => { e.stopPropagation(); setBackground({ url: "" }); }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Layout className="w-6 h-6 text-muted-foreground/40" />
                                        <span className="text-xs text-muted-foreground/60 font-medium">1920x1080 Recommended</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="bg-border/40" />

            {/* Video Clips Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        <Video className="w-4 h-4 text-primary" />
                        <span>Media Clips</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg gap-1 text-[10px] font-bold"
                        onClick={() => clipInputRef.current?.click()}
                    >
                        <Plus className="w-3 h-3" /> Add
                    </Button>
                </div>

                <input type="file" ref={clipInputRef} onChange={(e) => handleFileUpload("clip", e)} accept="video/*" className="hidden" />

                <div className="space-y-2">
                    {clips.length === 0 ? (
                        <div className="py-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 bg-secondary/10">
                            <Video className="w-5 h-5 text-muted-foreground/20" />
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter">No clips added yet</p>
                        </div>
                    ) : (
                        clips.map(clip => (
                            <div
                                key={clip.id}
                                className={cn(
                                    "group flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-all",
                                    activeClipId === clip.id && "bg-primary/10 border-primary/20 ring-1 ring-primary/20"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={cn(
                                        "p-2 rounded-lg bg-background border border-border/50",
                                        activeClipId === clip.id && "text-primary border-primary/20 shadow-sm"
                                    )}>
                                        <Video className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-medium truncate pr-2">{clip.name}</span>
                                </div>

                                <div className="flex gap-1.5 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 rounded-lg hover:bg-primary/20 hover:text-primary transition-all",
                                            activeClipId === clip.id && "bg-primary text-white hover:bg-primary/80 shadow-md"
                                        )}
                                        onClick={() => setActiveClip(activeClipId === clip.id ? null : clip.id)}
                                    >
                                        <Play className={cn("w-3.5 h-3.5", activeClipId === clip.id && "fill-current")} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                        onClick={() => removeClip(clip.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
