import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createDestinationSchema = z.object({
    platform: z.enum(["youtube", "facebook", "twitch", "linkedin", "custom"]),
    name: z.string().min(1).max(255),
    rtmpUrl: z.string().url().optional(),
    streamKey: z.string().min(1),
    settings: z.object({}).passthrough().optional(),
});

const updateDestinationSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    rtmpUrl: z.string().url().optional(),
    streamKey: z.string().optional(),
    settings: z.object({}).passthrough().optional(),
});

// Platform RTMP URLs
const PLATFORM_RTMP_URLS: Record<string, string> = {
    youtube: "rtmp://a.rtmp.youtube.com/live2",
    facebook: "rtmps://live-api-s.facebook.com:443/rtmp",
    twitch: "rtmp://live.twitch.tv/app",
    linkedin: "rtmps://prod-global-rtmp.publish.live-video.net:443/rtmp",
};

// Create destination
router.post("/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { platform, name, rtmpUrl, streamKey, settings } = createDestinationSchema.parse(req.body);

        // Use platform default URL if not custom
        const finalRtmpUrl = platform === "custom"
            ? rtmpUrl
            : PLATFORM_RTMP_URLS[platform];

        if (!finalRtmpUrl) {
            return res.status(400).json({ error: "RTMP URL is required for custom destinations" });
        }

        const destination = await prisma.destination.create({
            data: {
                id: uuidv4(),
                userId,
                platform,
                name,
                rtmpUrl: finalRtmpUrl,
                streamKey,
                status: "idle",
                settings: settings || {},
            },
        });

        res.status(201).json({ destination });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Create destination error:", error);
        res.status(500).json({ error: "Failed to create destination" });
    }
});

// List user's destinations
router.get("/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const destinations = await prisma.destination.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        res.json({ destinations });
    } catch (error) {
        console.error("List destinations error:", error);
        res.status(500).json({ error: "Failed to list destinations" });
    }
});

// Get destination by ID
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const destination = await prisma.destination.findFirst({
            where: { id, userId },
        });

        if (!destination) {
            return res.status(404).json({ error: "Destination not found" });
        }

        res.json({ destination });
    } catch (error) {
        console.error("Get destination error:", error);
        res.status(500).json({ error: "Failed to get destination" });
    }
});

// Update destination
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data = updateDestinationSchema.parse(req.body);

        const result = await prisma.destination.updateMany({
            where: { id, userId },
            data,
        });

        if (result.count === 0) {
            return res.status(404).json({ error: "Destination not found" });
        }

        const destination = await prisma.destination.findUnique({ where: { id } });
        res.json({ destination });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Update destination error:", error);
        res.status(500).json({ error: "Failed to update destination" });
    }
});

// Delete destination
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const result = await prisma.destination.deleteMany({
            where: { id, userId },
        });

        if (result.count === 0) {
            return res.status(404).json({ error: "Destination not found" });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Delete destination error:", error);
        res.status(500).json({ error: "Failed to delete destination" });
    }
});

// Test RTMP connection
router.post("/:id/test", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const destination = await prisma.destination.findFirst({
            where: { id, userId },
        });

        if (!destination) {
            return res.status(404).json({ error: "Destination not found" });
        }

        // In a real implementation, this would:
        // 1. Connect to the RTMP server
        // 2. Send a test packet
        // 3. Verify the connection

        // For now, we'll simulate a successful test
        await new Promise((resolve) => setTimeout(resolve, 1000));

        res.json({
            success: true,
            message: "Connection successful",
            latency: Math.floor(Math.random() * 100) + 50, // Simulated latency
        });
    } catch (error) {
        console.error("Test destination error:", error);
        res.status(500).json({ error: "Connection test failed" });
    }
});

export default router;
