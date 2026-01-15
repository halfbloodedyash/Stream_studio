"use client";

import Link from "next/link";
import { Radio, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Noise overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Grid overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundSize: '50px 50px',
                    backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
                    maskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 80%)'
                }}
            />

            {/* Glitch lines */}
            <div className="absolute top-1/4 left-0 w-full h-px bg-[#FF3300] opacity-20 animate-pulse" />
            <div className="absolute top-1/3 left-0 w-1/2 h-px bg-[#FF3300] opacity-10" />
            <div className="absolute bottom-1/3 right-0 w-1/3 h-px bg-[#FF3300] opacity-15" />

            {/* Main content */}
            <div className="relative z-10 text-center px-6">
                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 mb-8 text-[#FF3300] font-mono text-sm uppercase tracking-widest">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Signal Lost</span>
                </div>

                {/* 404 number */}
                <h1
                    className="text-[12rem] md:text-[16rem] font-bold leading-none tracking-tighter select-none"
                    style={{
                        fontFamily: "'Space Grotesk', monospace",
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #333333 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 80px rgba(255,51,0,0.2)'
                    }}
                >
                    404
                </h1>

                {/* Error message */}
                <div className="mb-12">
                    <h2
                        className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wide"
                        style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                        Transmission Not Found
                    </h2>
                    <p className="text-gray-500 max-w-md mx-auto font-mono text-sm">
                        The frequency you're trying to reach has been disconnected or never existed.
                        Check the coordinates and try again.
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF3300] text-black font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_rgba(255,255,255,0.1)]"
                        style={{
                            fontFamily: "'Space Grotesk', monospace",
                            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                        }}
                    >
                        <Home className="w-4 h-4" />
                        Return to Base
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 text-gray-300 font-bold uppercase tracking-wide transition-all hover:border-[#FF3300] hover:text-[#FF3300]"
                        style={{ fontFamily: "'Space Grotesk', monospace" }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                {/* Error code footer */}
                <div className="mt-16 font-mono text-xs text-gray-600 uppercase tracking-widest">
                    <span className="text-[#FF3300]">ERR_</span>BROADCAST_NOT_FOUND
                </div>
            </div>

            {/* Decorative corner elements */}
            <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-gray-800" />
            <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-gray-800" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-gray-800" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-gray-800" />

            {/* Scan line animation */}
            <div
                className="absolute inset-0 pointer-events-none z-40"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
                }}
            />
        </div>
    );
}
