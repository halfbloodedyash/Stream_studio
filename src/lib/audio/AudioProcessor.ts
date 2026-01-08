/**
 * AudioProcessor - Web Audio API based audio processing
 * Handles mixing, level analysis, noise suppression, and effects
 */

export interface AudioSource {
    id: string;
    type: "microphone" | "screen" | "music" | "soundEffect";
    name: string;
    stream?: MediaStream;
    volume: number;
    muted: boolean;
    pan: number; // -1 (left) to 1 (right)
    gainNode?: GainNode;
    pannerNode?: StereoPannerNode;
    analyserNode?: AnalyserNode;
}

export interface AudioLevels {
    peak: number;
    rms: number;
    clipping: boolean;
}

export class AudioProcessor {
    private audioContext: AudioContext;
    private masterGain: GainNode;
    private masterAnalyser: AnalyserNode;
    private destination: MediaStreamAudioDestinationNode;
    private sources: Map<string, AudioSource> = new Map();
    private sourceNodes: Map<string, MediaStreamAudioSourceNode> = new Map();
    private levelCallbacks: Map<string, (levels: AudioLevels) => void> = new Map();
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;

    constructor() {
        this.audioContext = new AudioContext();

        // Create master chain
        this.masterGain = this.audioContext.createGain();
        this.masterAnalyser = this.audioContext.createAnalyser();
        this.destination = this.audioContext.createMediaStreamDestination();

        // Connect master chain
        this.masterGain.connect(this.masterAnalyser);
        this.masterAnalyser.connect(this.destination);

        // Configure analyser
        this.masterAnalyser.fftSize = 256;
        this.masterAnalyser.smoothingTimeConstant = 0.8;
    }

    /**
     * Start audio processing
     */
    async start(): Promise<void> {
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
        this.isRunning = true;
        this.updateLevels();
    }

    /**
     * Stop audio processing
     */
    stop(): void {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Add an audio source
     */
    addSource(source: AudioSource): void {
        if (!source.stream || source.stream.getAudioTracks().length === 0) {
            console.warn(`AudioProcessor: Source ${source.id} has no audio tracks. Skipping.`);
            return;
        }

        // Create source node
        const sourceNode = this.audioContext.createMediaStreamSource(source.stream);

        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = source.muted ? 0 : source.volume;

        // Create panner node for stereo positioning
        const pannerNode = this.audioContext.createStereoPanner();
        pannerNode.pan.value = source.pan;

        // Create analyser for level metering
        const analyserNode = this.audioContext.createAnalyser();
        analyserNode.fftSize = 256;

        // Connect chain: source -> gain -> panner -> analyser -> master
        sourceNode.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(analyserNode);
        analyserNode.connect(this.masterGain);

        // Store references
        source.gainNode = gainNode;
        source.pannerNode = pannerNode;
        source.analyserNode = analyserNode;

        this.sources.set(source.id, source);
        this.sourceNodes.set(source.id, sourceNode);
    }

    /**
     * Remove an audio source
     */
    removeSource(id: string): void {
        const sourceNode = this.sourceNodes.get(id);
        const source = this.sources.get(id);

        if (sourceNode) {
            sourceNode.disconnect();
            this.sourceNodes.delete(id);
        }

        if (source) {
            source.gainNode?.disconnect();
            source.pannerNode?.disconnect();
            source.analyserNode?.disconnect();
            this.sources.delete(id);
        }

        this.levelCallbacks.delete(id);
    }

    /**
     * Set source volume (0-1)
     */
    setVolume(id: string, volume: number): void {
        const source = this.sources.get(id);
        if (source?.gainNode) {
            source.volume = Math.max(0, Math.min(1, volume));
            if (!source.muted) {
                source.gainNode.gain.setTargetAtTime(
                    source.volume,
                    this.audioContext.currentTime,
                    0.01
                );
            }
        }
    }

    /**
     * Mute/unmute source
     */
    setMuted(id: string, muted: boolean): void {
        const source = this.sources.get(id);
        if (source?.gainNode) {
            source.muted = muted;
            source.gainNode.gain.setTargetAtTime(
                muted ? 0 : source.volume,
                this.audioContext.currentTime,
                0.01
            );
        }
    }

    /**
     * Set stereo pan (-1 to 1)
     */
    setPan(id: string, pan: number): void {
        const source = this.sources.get(id);
        if (source?.pannerNode) {
            source.pan = Math.max(-1, Math.min(1, pan));
            source.pannerNode.pan.setTargetAtTime(
                source.pan,
                this.audioContext.currentTime,
                0.01
            );
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume: number): void {
        this.masterGain.gain.setTargetAtTime(
            Math.max(0, Math.min(1, volume)),
            this.audioContext.currentTime,
            0.01
        );
    }

    /**
     * Get audio levels for a source
     */
    getSourceLevels(id: string): AudioLevels {
        const source = this.sources.get(id);
        if (!source?.analyserNode) {
            return { peak: 0, rms: 0, clipping: false };
        }
        return this.calculateLevels(source.analyserNode);
    }

    /**
     * Get master output levels
     */
    getMasterLevels(): AudioLevels {
        return this.calculateLevels(this.masterAnalyser);
    }

    /**
     * Register callback for level updates
     */
    onLevelUpdate(id: string, callback: (levels: AudioLevels) => void): void {
        this.levelCallbacks.set(id, callback);
    }

    /**
     * Calculate audio levels from analyser
     */
    private calculateLevels(analyser: AnalyserNode): AudioLevels {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        let peak = 0;
        let sum = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const amplitude = Math.abs(dataArray[i] - 128) / 128;
            peak = Math.max(peak, amplitude);
            sum += amplitude * amplitude;
        }

        const rms = Math.sqrt(sum / dataArray.length);
        const clipping = peak > 0.95;

        return { peak, rms, clipping };
    }

    /**
     * Update levels and call callbacks
     */
    private updateLevels = (): void => {
        if (!this.isRunning) return;

        // Update each source's levels
        for (const [id, callback] of this.levelCallbacks) {
            const levels = this.getSourceLevels(id);
            callback(levels);
        }

        this.animationFrameId = requestAnimationFrame(this.updateLevels);
    };

    /**
     * Get output stream for recording/mixing
     */
    getOutputStream(): MediaStream {
        return this.destination.stream;
    }

    /**
     * Create a combined output stream (video + audio)
     */
    createCombinedStream(videoStream: MediaStream): MediaStream {
        const combinedStream = new MediaStream();

        // Add video tracks
        videoStream.getVideoTracks().forEach((track) => {
            combinedStream.addTrack(track);
        });

        // Add audio track from our processor
        this.destination.stream.getAudioTracks().forEach((track) => {
            combinedStream.addTrack(track);
        });

        return combinedStream;
    }

    /**
     * Add noise suppression (using Web Audio filters)
     * Note: For better noise suppression, use a dedicated library
     */
    addNoiseSuppression(id: string): void {
        const source = this.sources.get(id);
        if (!source?.gainNode) return;

        // Create a simple high-pass filter to reduce low-frequency noise
        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 80;

        // Create a low-pass filter to reduce high-frequency noise
        const lowpass = this.audioContext.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 12000;

        // Insert filters into chain
        const sourceNode = this.sourceNodes.get(id);
        if (sourceNode) {
            sourceNode.disconnect();
            sourceNode.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(source.gainNode);
        }
    }

    /**
     * Create audio ducking (lower music volume when voice is detected)
     */
    createDucker(
        voiceSourceId: string,
        musicSourceId: string,
        threshold: number = 0.3,
        reduction: number = 0.3
    ): void {
        // This would require more complex logic with a compressor/gate
        // For now, we'll implement a simple version in the updateLevels loop
    }

    /**
     * Get sample rate
     */
    getSampleRate(): number {
        return this.audioContext.sampleRate;
    }

    /**
     * Cleanup and destroy
     */
    destroy(): void {
        this.stop();
        this.sources.forEach((_, id) => this.removeSource(id));
        this.masterGain.disconnect();
        this.masterAnalyser.disconnect();
        this.destination.disconnect();
        this.audioContext.close();
    }
}
