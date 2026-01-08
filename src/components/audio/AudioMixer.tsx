"use client";

import { useState } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { VUMeter } from "./VUMeter";

interface AudioMixerProps {
    sources: AudioMixerSource[];
    onVolumeChange: (id: string, volume: number) => void;
    onMuteChange: (id: string, muted: boolean) => void;
    masterVolume: number;
    onMasterVolumeChange: (volume: number) => void;
}

export interface AudioMixerSource {
    id: string;
    name: string;
    type: "microphone" | "screen" | "music" | "soundEffect";
    volume: number;
    muted: boolean;
    level: number; // Current audio level 0-100
}

export function AudioMixer({
    sources,
    onVolumeChange,
    onMuteChange,
    masterVolume,
    onMasterVolumeChange,
}: AudioMixerProps) {
    return (
        <div className="audio-mixer">
            <style jsx>{`
        .audio-mixer {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .mixer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .mixer-title {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .mixer-channels {
          display: flex;
          gap: var(--space-4);
          overflow-x: auto;
          padding-bottom: var(--space-2);
        }

        .channel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          min-width: 60px;
        }

        .channel-fader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          height: 120px;
        }

        .fader-track {
          position: relative;
          width: 4px;
          height: 80px;
          background: var(--color-bg-primary);
          border-radius: var(--radius-full);
        }

        .fader-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--color-accent-secondary);
          border-radius: var(--radius-full);
          transition: height 50ms ease-out;
        }

        .fader-thumb {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 8px;
          background: var(--color-text-primary);
          border-radius: 2px;
          cursor: grab;
        }

        .volume-slider {
          -webkit-appearance: none;
          width: 4px;
          height: 80px;
          background: var(--color-bg-primary);
          border-radius: var(--radius-full);
          writing-mode: vertical-lr;
          direction: rtl;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 8px;
          background: var(--color-text-primary);
          border-radius: 2px;
          cursor: grab;
        }

        .volume-slider::-webkit-slider-thumb:hover {
          background: var(--color-accent-secondary);
        }

        .mute-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mute-btn:hover {
          background: var(--color-bg-hover);
        }

        .mute-btn.muted {
          background: hsla(0, 84%, 55%, 0.15);
          border-color: hsla(0, 84%, 55%, 0.3);
          color: var(--color-error);
        }

        .channel-label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          text-align: center;
          max-width: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .volume-value {
          font-size: var(--text-xs);
          font-family: var(--font-family-mono);
          color: var(--color-text-muted);
          min-width: 32px;
          text-align: center;
        }

        .master-section {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border-subtle);
        }

        .master-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }

        .master-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 4px;
          background: var(--color-bg-primary);
          border-radius: var(--radius-full);
          cursor: pointer;
        }

        .master-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--color-text-primary);
          border-radius: 50%;
          cursor: grab;
        }

        .master-slider::-webkit-slider-thumb:hover {
          background: var(--color-accent-secondary);
        }
      `}</style>

            <div className="mixer-header">
                <span className="mixer-title">Audio Mixer</span>
            </div>

            <div className="mixer-channels">
                {sources.map((source) => (
                    <div key={source.id} className="channel">
                        <VUMeter level={source.level} size="medium" />

                        <div className="channel-fader">
                            <input
                                type="range"
                                className="volume-slider"
                                min="0"
                                max="100"
                                value={source.volume * 100}
                                onChange={(e) =>
                                    onVolumeChange(source.id, parseInt(e.target.value) / 100)
                                }
                                disabled={source.muted}
                            />
                        </div>

                        <span className="volume-value">
                            {Math.round(source.volume * 100)}%
                        </span>

                        <button
                            className={`mute-btn ${source.muted ? "muted" : ""}`}
                            onClick={() => onMuteChange(source.id, !source.muted)}
                            title={source.muted ? "Unmute" : "Mute"}
                        >
                            {source.muted ? (
                                <VolumeX size={14} />
                            ) : source.volume > 0.5 ? (
                                <Volume2 size={14} />
                            ) : (
                                <Volume1 size={14} />
                            )}
                        </button>

                        <span className="channel-label" title={source.name}>
                            {source.name}
                        </span>
                    </div>
                ))}
            </div>

            <div className="master-section">
                <span className="master-label">Master</span>
                <input
                    type="range"
                    className="master-slider"
                    min="0"
                    max="100"
                    value={masterVolume * 100}
                    onChange={(e) => onMasterVolumeChange(parseInt(e.target.value) / 100)}
                />
                <span className="volume-value">{Math.round(masterVolume * 100)}%</span>
            </div>
        </div>
    );
}
