import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { rtmpService, PLATFORM_CONFIGS, StreamDestination } from "../services/rtmpService";

const router = Router();

// Validation schemas
const startStreamSchema = z.object({
    destinationId: z.string().uuid(),
    inputSource: z.string().optional(), // RTMP input or local source
});

const testConnectionSchema = z.object({
    platform: z.enum(["youtube", "facebook", "twitch", "linkedin", "custom"]),
    rtmpUrl: z.string().optional(),
    streamKey: z.string().min(1),
});

/**
 * GET /api/streaming/platforms
 * Get all supported platforms and their configurations
 */
router.get("/platforms", (req: Request, res: Response) => {
    const platforms = Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
        id: key,
        name: config.name,
        primaryUrl: config.primaryUrl,
        backupUrl: config.backupUrl,
        recommendedBitrate: config.recommendedBitrate,
        recommendedResolution: config.recommendedResolution,
        maxKeyframeInterval: config.maxKeyframeInterval,
        supportedCodecs: config.supportedCodecs,
        supportsBackupStream: config.supportsBackupStream,
        helpUrl: config.helpUrl,
        features: config.features,
    }));

    res.json({ platforms });
});

/**
 * GET /api/streaming/platforms/:platform
 * Get configuration for a specific platform
 */
router.get("/platforms/:platform", (req: Request, res: Response) => {
    const { platform } = req.params;
    const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];

    if (!config) {
        return res.status(404).json({ error: "Platform not found" });
    }

    res.json({
        id: platform,
        name: config.name,
        primaryUrl: config.primaryUrl,
        backupUrl: config.backupUrl,
        recommendedBitrate: config.recommendedBitrate,
        recommendedResolution: config.recommendedResolution,
        maxKeyframeInterval: config.maxKeyframeInterval,
        supportedCodecs: config.supportedCodecs,
        supportsBackupStream: config.supportsBackupStream,
        helpUrl: config.helpUrl,
        features: config.features,
    });
});

/**
 * POST /api/streaming/validate-key
 * Validate stream key format for a platform
 */
router.post("/validate-key", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { platform, streamKey } = testConnectionSchema.parse(req.body);

        const isValid = rtmpService.validateStreamKey(
            platform as keyof typeof PLATFORM_CONFIGS,
            streamKey
        );

        res.json({
            valid: isValid,
            platform,
            message: isValid
                ? "Stream key format is valid"
                : "Stream key format appears to be invalid for this platform",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Validation failed" });
    }
});

/**
 * POST /api/streaming/test-connection
 * Test RTMP connection to a destination
 */
router.post("/test-connection", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { platform, rtmpUrl, streamKey } = testConnectionSchema.parse(req.body);

        const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
        if (!config && platform !== "custom") {
            return res.status(400).json({ error: "Invalid platform" });
        }

        const destination: StreamDestination = {
            id: "test-" + Date.now(),
            platform: platform as StreamDestination["platform"],
            rtmpUrl: platform === "custom" ? (rtmpUrl || "") : config.primaryUrl,
            streamKey,
            name: "Connection Test",
            enabled: true,
        };

        const result = await rtmpService.testConnection(destination);

        res.json({
            success: result.success,
            latency: result.latency,
            error: result.error,
            serverInfo: result.serverInfo,
            platform: {
                name: config?.name || "Custom",
                features: config?.features || {},
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Test connection error:", error);
        res.status(500).json({ error: "Connection test failed" });
    }
});

/**
 * POST /api/streaming/start
 * Start streaming to a destination
 */
router.post("/start", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { destinationId, inputSource } = startStreamSchema.parse(req.body);
        const userId = (req as any).userId;

        // In a real implementation, you would:
        // 1. Fetch the destination from the database
        // 2. Verify the user owns this destination
        // 3. Start the stream using rtmpService

        // For now, we'll simulate this
        console.log(`[STREAMING] Starting stream for destination ${destinationId}`);

        // Simulate destination lookup
        const mockDestination: StreamDestination = {
            id: destinationId,
            platform: "youtube",
            rtmpUrl: PLATFORM_CONFIGS.youtube.primaryUrl,
            streamKey: "mock-stream-key",
            name: "Test Stream",
            enabled: true,
        };

        await rtmpService.startStream(
            mockDestination,
            inputSource || "rtmp://localhost:1935/live/stream"
        );

        res.json({
            success: true,
            message: "Stream started",
            destinationId,
        });
    } catch (error: any) {
        console.error("Start stream error:", error);
        res.status(500).json({ error: error.message || "Failed to start stream" });
    }
});

/**
 * POST /api/streaming/stop
 * Stop streaming to a destination
 */
router.post("/stop", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { destinationId } = z.object({ destinationId: z.string() }).parse(req.body);

        await rtmpService.stopStream(destinationId);

        res.json({
            success: true,
            message: "Stream stopped",
            destinationId,
        });
    } catch (error: any) {
        console.error("Stop stream error:", error);
        res.status(500).json({ error: error.message || "Failed to stop stream" });
    }
});

/**
 * GET /api/streaming/status/:destinationId
 * Get status of a specific stream
 */
router.get("/status/:destinationId", authMiddleware, async (req: Request, res: Response) => {
    const { destinationId } = req.params;

    const status = rtmpService.getStreamStatus(destinationId);

    if (!status) {
        return res.json({
            destinationId,
            status: "idle",
            stats: null,
        });
    }

    res.json(status);
});

/**
 * GET /api/streaming/active
 * Get all active streams
 */
router.get("/active", authMiddleware, async (req: Request, res: Response) => {
    const streams = rtmpService.getAllStreams();
    res.json({ streams });
});

/**
 * POST /api/streaming/stop-all
 * Stop all active streams
 */
router.post("/stop-all", authMiddleware, async (req: Request, res: Response) => {
    try {
        await rtmpService.stopAllStreams();
        res.json({
            success: true,
            message: "All streams stopped",
        });
    } catch (error: any) {
        console.error("Stop all streams error:", error);
        res.status(500).json({ error: error.message || "Failed to stop streams" });
    }
});

/**
 * GET /api/streaming/youtube/settings
 * Get YouTube-specific streaming settings and recommendations
 */
router.get("/youtube/settings", authMiddleware, async (req: Request, res: Response) => {
    const youtubeConfig = PLATFORM_CONFIGS.youtube;

    res.json({
        platform: "youtube",
        name: youtubeConfig.name,
        rtmpServers: {
            primary: youtubeConfig.primaryUrl,
            backup: youtubeConfig.backupUrl,
        },
        recommendedSettings: {
            video: {
                codec: "H.264",
                resolution: "1920x1080 (1080p)",
                frameRate: "30fps or 60fps",
                bitrate: `${youtubeConfig.recommendedBitrate.min}-${youtubeConfig.recommendedBitrate.max} Kbps`,
                keyframeInterval: `${youtubeConfig.maxKeyframeInterval} seconds`,
                profile: "High",
                level: "4.1",
            },
            audio: {
                codec: "AAC-LC",
                bitrate: "128 Kbps",
                sampleRate: "44.1 KHz",
                channels: "Stereo",
            },
        },
        features: youtubeConfig.features,
        tips: [
            "Use a wired internet connection for stability",
            "Set your stream to 'Unlisted' for testing before going public",
            "Enable DVR to allow viewers to rewind while live",
            "Use YouTube Studio to monitor stream health",
            "Keep your stream key private - never share it",
        ],
        helpUrl: youtubeConfig.helpUrl,
    });
});

/**
 * POST /api/streaming/youtube/go-live
 * Specialized endpoint for starting a YouTube Live stream
 */
router.post("/youtube/go-live", authMiddleware, async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            streamKey: z.string().min(4),
            title: z.string().optional(),
            description: z.string().optional(),
            privacy: z.enum(["public", "unlisted", "private"]).optional(),
            enableDvr: z.boolean().optional(),
            enableLowLatency: z.boolean().optional(),
            inputSource: z.string().optional(),
        });

        const data = schema.parse(req.body);
        const userId = (req as any).userId;

        // Validate stream key format
        const isValidKey = rtmpService.validateStreamKey("youtube", data.streamKey);
        if (!isValidKey) {
            return res.status(400).json({
                error: "Invalid stream key format",
                hint: "YouTube stream keys are typically alphanumeric with hyphens",
            });
        }

        // Build RTMP URL
        const rtmpUrl = rtmpService.buildRtmpUrl("youtube", data.streamKey);

        // Create destination
        const destination: StreamDestination = {
            id: `youtube-${userId}-${Date.now()}`,
            platform: "youtube",
            rtmpUrl: PLATFORM_CONFIGS.youtube.primaryUrl,
            streamKey: data.streamKey,
            name: data.title || "YouTube Live Stream",
            enabled: true,
        };

        // Test connection first
        const testResult = await rtmpService.testConnection(destination);
        if (!testResult.success) {
            return res.status(400).json({
                error: "Failed to connect to YouTube",
                details: testResult.error,
                hint: "Check your stream key and ensure your YouTube account is set up for live streaming",
            });
        }

        // Start the stream
        await rtmpService.startStream(
            destination,
            data.inputSource || "rtmp://localhost:1935/live/stream"
        );

        res.json({
            success: true,
            message: "YouTube Live stream started",
            destination: {
                id: destination.id,
                platform: "youtube",
                rtmpUrl,
                name: destination.name,
            },
            streamUrl: `https://youtube.com/live/${destination.id}`, // Would be actual YouTube URL
            embedUrl: `https://youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID`,
            connectionLatency: testResult.latency,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("YouTube go-live error:", error);
        res.status(500).json({ error: error.message || "Failed to start YouTube stream" });
    }
});

export default router;
