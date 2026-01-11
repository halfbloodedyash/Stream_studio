"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const livekit_server_sdk_1 = require("livekit-server-sdk");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// LiveKit configuration from environment
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
/**
 * Generate a LiveKit access token for a participant
 * POST /api/livekit/token
 */
router.post("/token", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { roomName, participantName, isHost = false } = req.body;
        if (!roomName || !participantName) {
            return res.status(400).json({ error: "roomName and participantName are required" });
        }
        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            return res.status(500).json({ error: "LiveKit not configured" });
        }
        // Create access token
        const at = new livekit_server_sdk_1.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: userId || participantName,
            name: participantName,
        });
        // Grant room permissions
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            // Hosts get additional permissions
            roomAdmin: isHost,
            roomRecord: isHost,
        });
        const token = await at.toJwt();
        res.json({
            token,
            roomName,
            participantName,
        });
    }
    catch (error) {
        console.error("Generate LiveKit token error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});
/**
 * Generate a guest token (no auth required, but limited permissions)
 * POST /api/livekit/guest-token
 */
router.post("/guest-token", async (req, res) => {
    try {
        const { roomName, participantName } = req.body;
        if (!roomName || !participantName) {
            return res.status(400).json({ error: "roomName and participantName are required" });
        }
        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            return res.status(500).json({ error: "LiveKit not configured" });
        }
        // Create access token for guest
        const at = new livekit_server_sdk_1.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: `guest_${Date.now()}_${participantName}`,
            name: participantName,
        });
        // Grant limited room permissions for guests
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            // Guests don't get admin permissions
            roomAdmin: false,
            roomRecord: false,
        });
        const token = await at.toJwt();
        res.json({
            token,
            roomName,
            participantName,
        });
    }
    catch (error) {
        console.error("Generate guest token error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});
exports.default = router;
//# sourceMappingURL=livekit.js.map