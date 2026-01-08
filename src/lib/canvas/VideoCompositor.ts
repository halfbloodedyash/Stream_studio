/**
 * VideoCompositor - Real-time video composition engine using HTML5 Canvas
 * Handles multi-source video compositing, overlays, and scene transitions
 */

export interface VideoSource {
    id: string;
    type: "camera" | "screen" | "image" | "video";
    stream?: MediaStream;
    element?: HTMLVideoElement | HTMLImageElement;
    position: Position;
    zIndex: number;
    visible: boolean;
    opacity: number;
    borderRadius?: number;
    label?: string;
}

export interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Overlay {
    id: string;
    type: "logo" | "lowerThird" | "text" | "image";
    position: Position;
    content: OverlayContent;
    visible: boolean;
    opacity: number;
    animation?: AnimationType;
}

export interface OverlayContent {
    text?: string;
    subtext?: string;
    imageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
    font?: string;
    fontSize?: number;
}

export type AnimationType = "none" | "fadeIn" | "slideLeft" | "slideUp";

export type LayoutType =
    | "solo"
    | "duo"
    | "trio"
    | "quad"
    | "grid"
    | "pip"
    | "sidebar"
    | "presentation"
    | "screenSharePip";

export interface LayoutConfig {
    type: LayoutType;
    positions: Position[];
    name: string;
    maxSources: number;
}

// Predefined layouts
export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
    solo: {
        type: "solo",
        name: "Single Speaker",
        maxSources: 1,
        positions: [{ x: 0, y: 0, width: 100, height: 100 }],
    },
    duo: {
        type: "duo",
        name: "Side by Side",
        maxSources: 2,
        positions: [
            { x: 0, y: 0, width: 50, height: 100 },
            { x: 50, y: 0, width: 50, height: 100 },
        ],
    },
    trio: {
        type: "trio",
        name: "Three Speakers",
        maxSources: 3,
        positions: [
            { x: 0, y: 0, width: 66.67, height: 100 },
            { x: 66.67, y: 0, width: 33.33, height: 50 },
            { x: 66.67, y: 50, width: 33.33, height: 50 },
        ],
    },
    quad: {
        type: "quad",
        name: "Grid of 4",
        maxSources: 4,
        positions: [
            { x: 0, y: 0, width: 50, height: 50 },
            { x: 50, y: 0, width: 50, height: 50 },
            { x: 0, y: 50, width: 50, height: 50 },
            { x: 50, y: 50, width: 50, height: 50 },
        ],
    },
    grid: {
        type: "grid",
        name: "Grid of 6",
        maxSources: 6,
        positions: [
            { x: 0, y: 0, width: 33.33, height: 50 },
            { x: 33.33, y: 0, width: 33.33, height: 50 },
            { x: 66.67, y: 0, width: 33.33, height: 50 },
            { x: 0, y: 50, width: 33.33, height: 50 },
            { x: 33.33, y: 50, width: 33.33, height: 50 },
            { x: 66.67, y: 50, width: 33.33, height: 50 },
        ],
    },
    pip: {
        type: "pip",
        name: "Picture in Picture",
        maxSources: 2,
        positions: [
            { x: 0, y: 0, width: 100, height: 100 },
            { x: 70, y: 65, width: 28, height: 32 },
        ],
    },
    sidebar: {
        type: "sidebar",
        name: "Sidebar",
        maxSources: 4,
        positions: [
            { x: 0, y: 0, width: 75, height: 100 },
            { x: 75, y: 0, width: 25, height: 33.33 },
            { x: 75, y: 33.33, width: 25, height: 33.33 },
            { x: 75, y: 66.67, width: 25, height: 33.34 },
        ],
    },
    presentation: {
        type: "presentation",
        name: "Presentation Mode",
        maxSources: 2,
        positions: [
            { x: 0, y: 0, width: 80, height: 100 },
            { x: 80, y: 70, width: 18, height: 28 },
        ],
    },
    screenSharePip: {
        type: "screenSharePip",
        name: "Screen Share with Camera",
        maxSources: 5,
        positions: [
            // First source (screen share) fills entire area
            { x: 0, y: 0, width: 100, height: 100 },
            // Second source (camera) in top-left corner
            { x: 2, y: 2, width: 20, height: 20 },
            // Third source (participant) below camera
            { x: 2, y: 24, width: 20, height: 20 },
            // Fourth source below that
            { x: 2, y: 46, width: 20, height: 20 },
            // Fifth source below that
            { x: 2, y: 68, width: 20, height: 20 },
        ],
    },
};

export class VideoCompositor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private sources: Map<string, VideoSource> = new Map();
    private overlays: Map<string, Overlay> = new Map();
    private currentLayout: LayoutType = "solo";
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;
    private backgroundColor: string = "#1a1a2e";
    private outputWidth: number = 1920;
    private outputHeight: number = 1080;

    // Branding assets
    private logoImage: HTMLImageElement | null = null;
    private backgroundImage: HTMLImageElement | null = null;
    private activeClipElement: HTMLVideoElement | null = null;

    // Engagement state
    private activePoll: any = null;
    private tickerText: string = "";
    private tickerOffset: number = 0;

    // Transition state
    private transitionProgress: number = 1;
    private transitionDuration: number = 500;
    private previousSources: Map<string, VideoSource> = new Map();
    private isTransitioning: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { alpha: false })!;
        this.canvas.width = this.outputWidth;
        this.canvas.height = this.outputHeight;
    }

    /**
     * Start the render loop
     */
    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.render();
    }

    /**
     * Stop the render loop
     */
    stop(): void {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Get the composed output stream
     */
    getStream(fps: number = 30): MediaStream {
        return this.canvas.captureStream(fps);
    }

    /**
     * Main render loop - runs at 60fps
     */
    private render = (): void => {
        if (!this.isRunning) return;

        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);

        // Update transition
        if (this.isTransitioning) {
            this.updateTransition();
        }

        // Render background
        this.renderBackground();

        // Render video sources
        this.renderSources();

        // Render overlays
        this.renderOverlays();

        // Render poll
        this.renderPoll();

        // Render ticker
        this.renderTicker();

        // Render logo
        this.renderBrandingLogo();

        // Render active clip (covers everything)
        this.renderActiveClip();

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.render);
    };

    /**
     * Add a video source
     */
    addSource(source: VideoSource): void {
        const existing = this.sources.get(source.id);

        // If it's a stream source and we already have a video element for this stream, reuse it
        if (source.stream && source.type !== "image") {
            if (existing?.element instanceof HTMLVideoElement && existing.stream === source.stream) {
                source.element = existing.element;
            } else {
                const video = document.createElement("video");
                video.srcObject = source.stream;
                video.autoplay = true;
                video.playsInline = true;
                video.muted = true;
                video.play().catch(console.error);
                source.element = video;
            }
        }

        this.sources.set(source.id, source);
        this.updateLayout();
    }

    /**
     * Check if a source exists
     */
    hasSource(id: string): boolean {
        return this.sources.has(id);
    }

    /**
     * Remove a video source
     */
    removeSource(id: string): void {
        const source = this.sources.get(id);
        if (source?.element instanceof HTMLVideoElement) {
            source.element.pause();
            source.element.srcObject = null;
        }
        this.sources.delete(id);
        this.updateLayout();
    }

    /**
     * Update source stream
     */
    updateSourceStream(id: string, stream: MediaStream): void {
        const source = this.sources.get(id);
        if (source) {
            if (source.element instanceof HTMLVideoElement) {
                source.element.srcObject = stream;
            } else {
                const video = document.createElement("video");
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                video.muted = true;
                video.play().catch(console.error);
                source.element = video;
            }
            source.stream = stream;
        }
    }

    /**
     * Set layout and recalculate positions
     */
    setLayout(layout: LayoutType, animate: boolean = true): void {
        if (animate && this.currentLayout !== layout) {
            this.startTransition();
        }
        this.currentLayout = layout;
        this.updateLayout();
    }

    /**
     * Update source positions based on current layout
     */
    private updateLayout(): void {
        const layoutConfig = LAYOUTS[this.currentLayout];
        const visibleSources = Array.from(this.sources.values()).filter(
            (s) => s.visible
        );

        visibleSources.forEach((source, index) => {
            if (index < layoutConfig.positions.length) {
                const pos = layoutConfig.positions[index];
                source.position = {
                    x: (pos.x / 100) * this.outputWidth,
                    y: (pos.y / 100) * this.outputHeight,
                    width: (pos.width / 100) * this.outputWidth,
                    height: (pos.height / 100) * this.outputHeight,
                };
            }
        });
    }

    /**
     * Start a transition between scenes
     */
    private startTransition(): void {
        this.previousSources = new Map(this.sources);
        this.transitionProgress = 0;
        this.isTransitioning = true;
    }

    /**
     * Update transition progress
     */
    private updateTransition(): void {
        this.transitionProgress += 16 / this.transitionDuration; // ~60fps
        if (this.transitionProgress >= 1) {
            this.transitionProgress = 1;
            this.isTransitioning = false;
            this.previousSources.clear();
        }
    }

    /**
     * Render all video sources
     */
    private renderSources(): void {
        const sortedSources = Array.from(this.sources.values())
            .filter((s) => s.visible)
            .sort((a, b) => a.zIndex - b.zIndex);

        for (const source of sortedSources) {
            this.renderSource(source);
        }
    }

    /**
     * Render a single video source
     */
    private renderSource(source: VideoSource): void {
        const { position, opacity, borderRadius = 0 } = source;
        const { x, y, width, height } = position;

        // Apply opacity
        this.ctx.globalAlpha = opacity;

        // Draw with rounded corners if specified
        if (borderRadius > 0) {
            this.roundRect(x, y, width, height, borderRadius);
            this.ctx.clip();
        }

        // Draw video/image
        if (source.element) {
            try {
                // Calculate aspect ratio fit
                const sourceWidth =
                    source.element instanceof HTMLVideoElement
                        ? source.element.videoWidth
                        : source.element.width;
                const sourceHeight =
                    source.element instanceof HTMLVideoElement
                        ? source.element.videoHeight
                        : source.element.height;

                if (sourceWidth && sourceHeight) {
                    const scale = Math.max(width / sourceWidth, height / sourceHeight);
                    const scaledWidth = sourceWidth * scale;
                    const scaledHeight = sourceHeight * scale;
                    const offsetX = x + (width - scaledWidth) / 2;
                    const offsetY = y + (height - scaledHeight) / 2;

                    this.ctx.drawImage(
                        source.element,
                        offsetX,
                        offsetY,
                        scaledWidth,
                        scaledHeight
                    );
                }
            } catch (e) {
                // Video not ready yet, draw placeholder
                this.ctx.fillStyle = "#2a2a4a";
                this.ctx.fillRect(x, y, width, height);
            }
        } else {
            // Draw placeholder
            this.ctx.fillStyle = "#2a2a4a";
            this.ctx.fillRect(x, y, width, height);
        }

        // Reset clip
        if (borderRadius > 0) {
            this.ctx.restore();
            this.ctx.save();
        }

        // Draw label if present
        if (source.label) {
            this.renderSourceLabel(source);
        }

        // Reset opacity
        this.ctx.globalAlpha = 1;
    }

    /**
     * Render source label (name tag)
     */
    private renderSourceLabel(source: VideoSource): void {
        const { position, label } = source;
        const padding = 8;
        const fontSize = 16;

        this.ctx.font = `500 ${fontSize}px Inter, sans-serif`;
        const textWidth = this.ctx.measureText(label!).width;

        const labelX = position.x + padding;
        const labelY = position.y + position.height - padding - fontSize - padding;
        const labelWidth = textWidth + padding * 2;
        const labelHeight = fontSize + padding * 2;

        // Background
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.roundRect(labelX, labelY, labelWidth, labelHeight, 4);
        this.ctx.fill();

        // Text
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillText(
            label!,
            labelX + padding,
            labelY + padding + fontSize - 2
        );
    }

    /**
     * Add an overlay
     */
    addOverlay(overlay: Overlay): void {
        this.overlays.set(overlay.id, overlay);
    }

    /**
     * Remove an overlay
     */
    removeOverlay(id: string): void {
        this.overlays.delete(id);
    }

    /**
     * Update overlay visibility
     */
    setOverlayVisible(id: string, visible: boolean): void {
        const overlay = this.overlays.get(id);
        if (overlay) {
            overlay.visible = visible;
        }
    }

    /**
     * Render all overlays
     */
    private renderOverlays(): void {
        for (const overlay of this.overlays.values()) {
            if (overlay.visible) {
                this.renderOverlay(overlay);
            }
        }
    }

    /**
     * Render a single overlay
     */
    private renderOverlay(overlay: Overlay): void {
        switch (overlay.type) {
            case "lowerThird":
                this.renderLowerThird(overlay);
                break;
            case "logo":
                this.renderLogo(overlay);
                break;
            case "text":
                this.renderText(overlay);
                break;
        }
    }

    /**
     * Render a lower third overlay
     */
    private renderLowerThird(overlay: Overlay): void {
        const { position, content, opacity } = overlay;
        const {
            text,
            subtext,
            backgroundColor = "#2dd4bf", // Default to branding teal
            textColor = "#ffffff",
        } = content;

        this.ctx.globalAlpha = opacity;

        // Main background
        this.ctx.fillStyle = backgroundColor;
        this.roundRect(
            position.x,
            position.y,
            position.width,
            position.height,
            4
        );
        this.ctx.fill();

        // Accents or gradients can be added here

        // Text
        this.ctx.fillStyle = textColor;
        this.ctx.font = `bold 24px ${content.font || "Inter"}, sans-serif`;
        this.ctx.fillText(text || "", position.x + 16, position.y + 35);

        if (subtext) {
            this.ctx.font = `500 16px ${content.font || "Inter"}, sans-serif`;
            this.ctx.fillText(subtext, position.x + 16, position.y + 60);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Branding: Set logo image
     */
    setLogoImage(url: string | null): void {
        if (!url) {
            this.logoImage = null;
            return;
        }
        const img = new Image();
        img.src = url;
        img.onload = () => {
            this.logoImage = img;
        };
    }

    /**
     * Branding: Set background image
     */
    setBackgroundImage(url: string | null): void {
        if (!url) {
            this.backgroundImage = null;
            return;
        }
        const img = new Image();
        img.src = url;
        img.onload = () => {
            this.backgroundImage = img;
        };
    }

    /**
     * Branding: Play a clip
     */
    playClip(url: string, onEnded?: () => void): void {
        if (this.activeClipElement) {
            this.activeClipElement.pause();
            this.activeClipElement = null;
        }

        const video = document.createElement("video");
        video.src = url;
        video.autoplay = true;
        video.onended = () => {
            this.activeClipElement = null;
            onEnded?.();
        };
        video.play().catch(console.error);
        this.activeClipElement = video;
    }

    /**
     * Render Branding Logo
     */
    private renderBrandingLogo(): void {
        if (!this.logoImage) return;

        const margin = 40;
        const sizePercent = 0.1; // 10% of width
        const width = this.outputWidth * sizePercent;
        const height = (this.logoImage.height / this.logoImage.width) * width;

        // Position: Top Right (default)
        const x = this.outputWidth - width - margin;
        const y = margin;

        this.ctx.drawImage(this.logoImage, x, y, width, height);
    }

    /**
     * Render Background
     */
    private renderBackground(): void {
        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.outputWidth, this.outputHeight);
        } else {
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
        }
    }

    /**
     * Render Active Clip
     */
    private renderActiveClip(): void {
        if (!this.activeClipElement) return;

        try {
            this.ctx.drawImage(this.activeClipElement, 0, 0, this.outputWidth, this.outputHeight);
        } catch (e) {
            // Video might not be ready
        }
    }

    /**
     * Render a logo overlay
     */
    private renderLogo(overlay: Overlay): void {
        // Logo rendering would load an image
        // For now, draw a placeholder
        const { position, opacity } = overlay;
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(position.x, position.y, position.width, position.height);
        this.ctx.globalAlpha = 1;
    }

    /**
     * Render a text overlay
     */
    private renderText(overlay: Overlay): void {
        const { position, content, opacity } = overlay;
        const {
            text,
            textColor = "#ffffff",
            fontSize = 24,
            font = "Inter",
        } = content;

        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = textColor;
        this.ctx.font = `bold ${fontSize}px ${font}, sans-serif`;
        this.ctx.fillText(text || "", position.x, position.y + fontSize);
        this.ctx.globalAlpha = 1;
    }

    /**
     * Helper: Draw rounded rectangle
     */
    private roundRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height
        );
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * Helper: Adjust color opacity
     */
    private adjustColorOpacity(color: string, opacity: number): string {
        if (color.startsWith("#")) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }

    /**
     * Get canvas as MediaStream for recording/streaming
     */
    getOutputStream(frameRate: number = 30): MediaStream {
        return this.canvas.captureStream(frameRate);
    }

    /**
     * Set output resolution
     */
    setResolution(width: number, height: number): void {
        this.outputWidth = width;
        this.outputHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.updateLayout();
    }

    /**
     * Set active poll
     */
    setPoll(poll: any | null): void {
        this.activePoll = poll;
    }

    /**
     * Set ticker text
     */
    setTicker(text: string): void {
        this.tickerText = text;
        this.tickerOffset = this.outputWidth;
    }

    /**
     * Render Poll Results
     */
    private renderPoll(): void {
        if (!this.activePoll) return;

        const margin = 50;
        const width = 400;
        const padding = 24;
        const optionHeight = 40;
        const headerHeight = 60;

        const height = headerHeight + (this.activePoll.options.length * (optionHeight + 10)) + padding;
        const x = this.outputWidth - width - margin;
        const y = this.outputHeight - height - margin - 50;

        // Container
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        this.roundRect(x, y, width, height, 12);
        this.ctx.fill();

        // Question
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 20px Inter, sans-serif";
        this.ctx.fillText(this.activePoll.question, x + padding, y + 40);

        // Options
        this.activePoll.options.forEach((opt: any, i: number) => {
            const optY = y + headerHeight + (i * (optionHeight + 10));
            const percent = this.activePoll.totalVotes > 0 ? (opt.votes / this.activePoll.totalVotes) : 0;

            // Bar background
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            this.roundRect(x + padding, optY, width - padding * 2, optionHeight, 4);
            this.ctx.fill();

            // Bar fill
            if (percent > 0) {
                this.ctx.fillStyle = "#2dd4bf"; // Use brand color
                this.roundRect(x + padding, optY, (width - padding * 2) * percent, optionHeight, 4);
                this.ctx.fill();
            }

            // Text
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "500 16px Inter, sans-serif";
            this.ctx.fillText(opt.text, x + padding + 12, optY + 25);
            this.ctx.fillText(`${Math.round(percent * 100)}%`, x + width - padding - 45, optY + 25);
        });
    }

    /**
     * Render Scrolling Ticker
     */
    private renderTicker(): void {
        if (!this.tickerText) return;

        const height = 40;
        const y = this.outputHeight - height;

        // Background
        this.ctx.fillStyle = "#2dd4bf"; // Brand color
        this.ctx.fillRect(0, y, this.outputWidth, height);

        // Text
        this.ctx.fillStyle = "#000000";
        this.ctx.font = "bold 18px Inter, sans-serif";
        const textToDraw = `${this.tickerText}  •  `.repeat(4);

        this.ctx.fillText(textToDraw, this.tickerOffset, y + 27);

        // Update offset
        this.tickerOffset -= 2; // Speed
        if (this.tickerOffset < -this.ctx.measureText(textToDraw).width / 2) {
            this.tickerOffset = 0;
        }
    }

    /**
     * Get current layout
     */
    getLayout(): LayoutType {
        return this.currentLayout;
    }

    /**
     * Destroy compositor and cleanup
     */
    destroy(): void {
        this.stop();
        this.sources.forEach((source) => {
            if (source.element instanceof HTMLVideoElement) {
                source.element.pause();
                source.element.srcObject = null;
            }
        });
        this.sources.clear();
        this.overlays.clear();
    }
}
