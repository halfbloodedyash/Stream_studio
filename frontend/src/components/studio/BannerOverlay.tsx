"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Layout } from "lucide-react";

export type BannerStyle = "standard" | "minimal" | "ticker";

export interface BannerData {
    id: string;
    text: string;
    style: BannerStyle;
}

interface BannerOverlayProps {
    activeBanner: BannerData | null;
}

export function BannerOverlay({ activeBanner }: BannerOverlayProps) {
    if (!activeBanner) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end pb-8 overflow-hidden">
            <AnimatePresence mode="wait">
                {activeBanner.style === "standard" && (
                    <motion.div
                        key={`std-${activeBanner.id}`}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="w-full flex justify-center px-8"
                    >
                        <div className="bg-primary text-primary-foreground px-8 py-4 rounded-xl shadow-2xl max-w-4xl text-center">
                            <h2 className="text-2xl font-bold uppercase tracking-wide leading-tight drop-shadow-md">
                                {activeBanner.text}
                            </h2>
                        </div>
                    </motion.div>
                )}

                {activeBanner.style === "minimal" && (
                    <motion.div
                        key={`min-${activeBanner.id}`}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex justify-start px-8 mb-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-1.5 bg-primary rounded-full" />
                            <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-lg border-l-0 border border-white/10 shadow-xl">
                                <p className="text-lg font-medium">{activeBanner.text}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeBanner.style === "ticker" && (
                    <motion.div
                        key={`tick-${activeBanner.id}`}
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        transition={{ duration: 0.3 }}
                        className="w-full bg-primary text-primary-foreground py-2 shadow-xl border-t-2 border-primary-foreground/20"
                    >
                        <div className="overflow-hidden whitespace-nowrap flex">
                            <motion.div
                                animate={{ x: ["100%", "-100%"] }}
                                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                                className="flex items-center gap-8 text-lg font-bold uppercase tracking-wider"
                            >
                                <span>{activeBanner.text}</span>
                                <Zap className="w-5 h-5 opacity-50" />
                                <span>{activeBanner.text}</span>
                                <Zap className="w-5 h-5 opacity-50" />
                                <span>{activeBanner.text}</span>
                                <Zap className="w-5 h-5 opacity-50" />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
