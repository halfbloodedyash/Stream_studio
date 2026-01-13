"use client";

import { useState } from "react";
import { Type, Zap, Trash2, Layout, Plus } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BannerData, BannerStyle } from "./BannerOverlay";

interface BannersManagerProps {
    banners: BannerData[];
    activeBanner: BannerData | null;
    onUpdate: (banners: BannerData[], activeBanner: BannerData | null) => void;
}

export function BannersManager({ banners, activeBanner, onUpdate }: BannersManagerProps) {
    const [newText, setNewText] = useState("");
    const [newStyle, setNewStyle] = useState<BannerStyle>("standard");

    const addBanner = () => {
        if (newText.trim()) {
            const newBanner: BannerData = {
                id: Date.now().toString(),
                text: newText,
                style: newStyle,
            };
            onUpdate([...banners, newBanner], activeBanner);
            setNewText("");
        }
    };

    const toggleBanner = (banner: BannerData) => {
        // If clicking the currently active banner, hide it (set active to null)
        // Otherwise set this banner as active
        const isActive = activeBanner?.id === banner.id;
        onUpdate(banners, isActive ? null : banner);
    };

    const deleteBanner = (id: string) => {
        const newBanners = banners.filter((b) => b.id !== id);
        // If deleting active banner, hide it
        const newActive = activeBanner?.id === id ? null : activeBanner;
        onUpdate(newBanners, newActive);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                <Type className="w-4 h-4 text-primary" />
                <span>Banners & Tickers</span>
            </div>

            <Card className="p-4 bg-secondary/20 border-border/60 shadow-xl space-y-4">
                <div className="space-y-2">
                    <Textarea
                        className="rounded-xl bg-card border-border/40 focus:ring-primary/20 min-h-[80px] text-sm resize-none"
                        placeholder="Enter banner text (e.g. Guest names, social handles...)"
                        value={newText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewText(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select onValueChange={(val: BannerStyle) => setNewStyle(val)} defaultValue="standard">
                        <SelectTrigger className="flex-1 rounded-xl bg-card border-border/40 h-10 text-xs">
                            <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/60 shadow-xl">
                            <SelectItem value="standard" className="text-xs">Standard Banner</SelectItem>
                            <SelectItem value="minimal" className="text-xs">Minimal Lower Third</SelectItem>
                            <SelectItem value="ticker" className="text-xs">Scrolling Ticker</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={addBanner} className="rounded-xl font-bold px-6 h-10 shadow-lg shadow-primary/10">
                        Add
                    </Button>
                </div>
            </Card>

            <div className="space-y-3">
                {banners.map((banner) => {
                    const isActive = activeBanner?.id === banner.id;
                    return (
                        <Card
                            key={banner.id}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl border-border/40 transition-all hover:bg-secondary/10",
                                isActive && "shadow-lg shadow-primary/5 bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                            )}
                        >
                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground gap-1 border-none">
                                        {banner.style === "ticker" ? <Zap className="w-2.5 h-2.5" /> : <Layout className="w-2.5 h-2.5" />}
                                        {banner.style}
                                    </Badge>

                                    <div className="flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteBanner(banner.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-sm font-medium leading-relaxed pr-2">{banner.text}</p>

                                <div className="flex items-center justify-between pt-1">
                                    {isActive ? (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            Visible on stream
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wide">
                                            Hidden
                                        </div>
                                    )}

                                    <Button
                                        size="sm"
                                        variant={isActive ? "default" : "secondary"}
                                        className={cn(
                                            "h-8 rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider transition-all",
                                            isActive ? "shadow-md bg-primary" : "bg-card hover:bg-muted"
                                        )}
                                        onClick={() => toggleBanner(banner)}
                                    >
                                        {isActive ? "Hide" : "Show"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

