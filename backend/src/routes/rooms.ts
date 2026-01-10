import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { randomBytes } from "crypto";

const router = Router();

// Validation schemas
const createRoomSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    settings: z.object({
        layout: z.string().optional(),
        maxParticipants: z.number().optional(),
        isRecordingEnabled: z.boolean().optional(),
    }).optional(),
});

const updateRoomSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    settings: z.object({}).passthrough().optional(),
});

// Create room
router.post("/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { title, description, settings } = createRoomSchema.parse(req.body);

        const { data: room, error } = await supabase
            .from("rooms")
            .insert({
                user_id: userId,
                title,
                description,
                status: "draft",
                settings: settings || {},
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ room });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Create room error:", error);
        res.status(500).json({ error: "Failed to create room" });
    }
});

// List user's rooms
router.get("/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { status, limit = 20, offset = 0 } = req.query;

        let query = supabase
            .from("rooms")
            .select("*, participants(count)", { count: "exact" })
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (status) {
            query = query.eq("status", status);
        }

        const { data: rooms, error, count } = await query;

        if (error) throw error;

        res.json({ rooms, total: count || 0, limit: Number(limit), offset: Number(offset) });
    } catch (error) {
        console.error("List rooms error:", error);
        res.status(500).json({ error: "Failed to list rooms" });
    }
});

// Get room by ID
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const { data: room, error } = await supabase
            .from("rooms")
            .select("*, participants(*), recordings(count)")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error || !room) {
            return res.status(404).json({ error: "Room not found" });
        }

        res.json({ room });
    } catch (error) {
        console.error("Get room error:", error);
        res.status(500).json({ error: "Failed to get room" });
    }
});

// Update room
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data = updateRoomSchema.parse(req.body);

        // Convert camelCase to snake_case for Supabase
        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.settings) updateData.settings = data.settings;

        const { data: room, error } = await supabase
            .from("rooms")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error || !room) {
            return res.status(404).json({ error: "Room not found" });
        }

        res.json({ room });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Update room error:", error);
        res.status(500).json({ error: "Failed to update room" });
    }
});

// Delete room
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const { error } = await supabase
            .from("rooms")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) {
            return res.status(404).json({ error: "Room not found" });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Delete room error:", error);
        res.status(500).json({ error: "Failed to delete room" });
    }
});

// Generate invite link
router.post("/:id/invite", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { name, role = "guest" } = req.body;

        // Verify room ownership
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("id")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (roomError || !room) {
            return res.status(404).json({ error: "Room not found" });
        }

        // Create participant with invite token
        const inviteToken = randomBytes(6).toString("hex");

        const { data: participant, error } = await supabase
            .from("participants")
            .insert({
                room_id: id,
                name: name || "Guest",
                invite_token: inviteToken,
                role,
            })
            .select()
            .single();

        if (error) throw error;

        const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/join/${inviteToken}`;

        res.json({
            inviteToken,
            inviteUrl,
            participant,
        });
    } catch (error) {
        console.error("Generate invite error:", error);
        res.status(500).json({ error: "Failed to generate invite" });
    }
});

// Get room participants
router.get("/:id/participants", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        // Verify room ownership
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("id")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (roomError || !room) {
            return res.status(404).json({ error: "Room not found" });
        }

        const { data: participants, error } = await supabase
            .from("participants")
            .select("*")
            .eq("room_id", id)
            .order("joined_at", { ascending: true, nullsFirst: false });

        if (error) throw error;

        res.json({ participants });
    } catch (error) {
        console.error("Get participants error:", error);
        res.status(500).json({ error: "Failed to get participants" });
    }
});

// Start broadcast (set room to live)
router.post("/:id/start", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const { data: room, error } = await supabase
            .from("rooms")
            .update({
                status: "live",
                started_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error || !room) {
            return res.status(404).json({ error: "Room not found" });
        }

        res.json({ success: true, status: "live" });
    } catch (error) {
        console.error("Start broadcast error:", error);
        res.status(500).json({ error: "Failed to start broadcast" });
    }
});

// End broadcast
router.post("/:id/end", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const { data: room, error } = await supabase
            .from("rooms")
            .update({
                status: "ended",
                ended_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error || !room) {
            return res.status(404).json({ error: "Room not found" });
        }

        res.json({ success: true, status: "ended" });
    } catch (error) {
        console.error("End broadcast error:", error);
        res.status(500).json({ error: "Failed to end broadcast" });
    }
});

export default router;
