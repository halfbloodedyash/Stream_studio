"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get current user profile
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        // Fetch user profile from Supabase
        const { data: user, error } = await supabase_1.supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user });
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});
// Health check for auth service
router.get("/health", (req, res) => {
    res.json({ status: "ok", service: "auth" });
});
exports.default = router;
//# sourceMappingURL=auth.js.map