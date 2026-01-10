"use client";

import React from 'react';

export function BackgroundEffects() {
    return (
        <>
            <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] noise-bg" />
            <div className="fixed inset-0 pointer-events-none z-0 grid-overlay" />
        </>
    );
}
