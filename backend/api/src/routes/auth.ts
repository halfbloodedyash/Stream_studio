import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Get current user profile
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Fetch user profile from Supabase
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Health check for auth service
router.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", service: "auth" });
});

export default router;
