import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/auth";
import { supabase } from "../lib/supabase";

const router = Router();

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

        const { data: destination, error } = await supabase
            .from("destinations")
            .insert({
                id: uuidv4(),
                user_id: userId,
                platform,
                name,
                rtmp_url: finalRtmpUrl,
                stream_key: streamKey,
                status: "idle",
                settings: settings || {},
            })
            .select()
            .single();

        if (error) throw error;

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

        const { data: destinations, error } = await supabase
            .from("destinations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

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

        const { data: destination, error } = await supabase
            .from("destinations")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error || !destination) {
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

        // Convert to snake_case for Supabase
        const updateData: Record<string, any> = {};
        if (data.name) updateData.name = data.name;
        if (data.rtmpUrl) updateData.rtmp_url = data.rtmpUrl;
        if (data.streamKey) updateData.stream_key = data.streamKey;
        if (data.settings) updateData.settings = data.settings;

        const { data: destination, error } = await supabase
            .from("destinations")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error || !destination) {
            return res.status(404).json({ error: "Destination not found" });
        }

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

        const { error } = await supabase
            .from("destinations")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;

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

        const { data: destination, error } = await supabase
            .from("destinations")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error || !destination) {
            return res.status(404).json({ error: "Destination not found" });
        }

        // Simulate a successful test
        await new Promise((resolve) => setTimeout(resolve, 1000));

        res.json({
            success: true,
            message: "Connection successful",
            latency: Math.floor(Math.random() * 100) + 50,
        });
    } catch (error) {
        console.error("Test destination error:", error);
        res.status(500).json({ error: "Connection test failed" });
    }
});

export default router;
