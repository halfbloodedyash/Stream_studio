import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { youtubeOAuthService } from "../services/youtubeOAuth";
import { youtubeChatService, ChatMessage } from "../services/youtubeChat";
import { safeGet, safeSet, safeDel } from "../lib/redis";

const router = Router();

// In-memory fallback for highlighted messages
const memoryHighlights: Map<string, ChatMessage & { expiresAt: number }> = new Map();

// Redis key prefix for highlights
const HIGHLIGHT_KEY_PREFIX = "highlight:";

/**
 * Helper to get highlighted message (Redis or memory)
 */
async function getHighlight(roomId: string): Promise<(ChatMessage & { expiresAt: number }) | null> {
    const redisKey = `${HIGHLIGHT_KEY_PREFIX}${roomId}`;
    const redisData = await safeGet(redisKey);

    if (redisData) {
        try {
            const data = JSON.parse(redisData);
            data.timestamp = new Date(data.timestamp);
            return data;
        } catch {
            console.error(`[CHAT] Failed to parse highlight data for room: ${roomId}`);
        }
    }

    return memoryHighlights.get(`${roomId}:highlight`) || null;
}

/**
 * Helper to set highlighted message (Redis or memory)
 */
async function setHighlight(
    roomId: string,
    message: ChatMessage & { expiresAt: number },
    durationMs: number
): Promise<void> {
    const redisKey = `${HIGHLIGHT_KEY_PREFIX}${roomId}`;
    const ttlSeconds = Math.ceil(durationMs / 1000);

    const stored = await safeSet(redisKey, JSON.stringify(message), ttlSeconds);

    if (!stored) {
        // Fallback to memory with timeout
        const memKey = `${roomId}:highlight`;
        memoryHighlights.set(memKey, message);

        setTimeout(() => {
            const current = memoryHighlights.get(memKey);
            if (current && current.id === message.id) {
                memoryHighlights.delete(memKey);
            }
        }, durationMs);
    }
}

/**
 * Helper to delete highlighted message
 */
async function deleteHighlight(roomId: string): Promise<void> {
    const redisKey = `${HIGHLIGHT_KEY_PREFIX}${roomId}`;
    await safeDel(redisKey);
    memoryHighlights.delete(`${roomId}:highlight`);
}

// =============================================================================
// YOUTUBE OAUTH ENDPOINTS
// =============================================================================

/**
 * GET /api/chat/youtube/auth
 * Initiate YouTube OAuth flow - returns authorization URL
 */
router.get("/youtube/auth", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const authUrl = youtubeOAuthService.getAuthUrl(userId);

        console.log(`[CHAT] Generated YouTube auth URL for user: ${userId}`);

        res.json({
            authUrl,
            message: "Redirect user to this URL to authorize YouTube access",
        });
    } catch (error: any) {
        console.error("[CHAT] YouTube auth error:", error);
        res.status(500).json({ error: "Failed to generate authorization URL" });
    }
});

/**
 * GET /api/chat/youtube/callback
 * OAuth callback - exchange code for tokens
 */
router.get("/youtube/callback", async (req: Request, res: Response) => {
    try {
        const { code, state: userId, error } = req.query;

        if (error) {
            console.error(`[CHAT] YouTube OAuth error: ${error}`);
            // Redirect to frontend with error
            return res.redirect(`${process.env.FRONTEND_URL}/studio?youtube_error=${error}`);
        }

        if (!code || !userId) {
            return res.status(400).json({ error: "Missing code or state parameter" });
        }

        // Exchange code for tokens
        await youtubeOAuthService.exchangeCode(code as string, userId as string);

        console.log(`[CHAT] YouTube OAuth successful for user: ${userId}`);

        // Redirect back to studio with success indicator
        res.redirect(`${process.env.FRONTEND_URL}/studio?youtube_connected=true`);

    } catch (error: any) {
        console.error("[CHAT] YouTube OAuth callback error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/studio?youtube_error=token_exchange_failed`);
    }
});

/**
 * GET /api/chat/youtube/status
 * Check if user is connected to YouTube
 */
router.get("/youtube/status", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const isConnected = await youtubeOAuthService.isConnected(userId);

        if (isConnected) {
            // Get channel info if connected
            const channelInfo = await youtubeChatService.getChannelInfo(userId);
            res.json({
                connected: true,
                channel: channelInfo,
            });
        } else {
            res.json({ connected: false });
        }
    } catch (error: any) {
        console.error("[CHAT] YouTube status check error:", error);
        res.json({ connected: false, error: error.message });
    }
});

/**
 * POST /api/chat/youtube/disconnect
 * Disconnect user from YouTube
 */
router.post("/youtube/disconnect", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        await youtubeOAuthService.disconnect(userId);

        res.json({ success: true, message: "Disconnected from YouTube" });
    } catch (error: any) {
        console.error("[CHAT] YouTube disconnect error:", error);
        res.status(500).json({ error: "Failed to disconnect" });
    }
});

// =============================================================================
// BROADCAST ENDPOINTS
// =============================================================================

/**
 * GET /api/chat/youtube/broadcasts
 * Get user's live broadcasts
 */
router.get("/youtube/broadcasts", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const [active, upcoming] = await Promise.all([
            youtubeChatService.getActiveBroadcasts(userId),
            youtubeChatService.getUpcomingBroadcasts(userId),
        ]);

        res.json({
            active,
            upcoming,
        });
    } catch (error: any) {
        console.error("[CHAT] Get broadcasts error:", error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// CHAT MESSAGE ENDPOINTS
// =============================================================================

/**
 * GET /api/chat/youtube/messages/:liveChatId
 * Fetch live chat messages for a broadcast
 */
router.get("/youtube/messages/:liveChatId", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { liveChatId } = req.params;
        const maxResults = parseInt(req.query.maxResults as string) || 50;

        const { messages, pollingIntervalMs } = await youtubeChatService.getChatMessages(
            userId,
            liveChatId,
            maxResults
        );

        res.json({
            messages,
            pollingIntervalMs,
            count: messages.length,
        });
    } catch (error: any) {
        console.error("[CHAT] Get messages error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/chat/youtube/messages/:liveChatId
 * Send a message to the live chat
 */
router.post("/youtube/messages/:liveChatId", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { liveChatId } = req.params;
        const { message } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Message is required" });
        }

        const sentMessage = await youtubeChatService.sendMessage(userId, liveChatId, message);

        res.json({
            success: true,
            message: sentMessage,
        });
    } catch (error: any) {
        console.error("[CHAT] Send message error:", error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// HIGHLIGHT ENDPOINTS (for overlays)
// =============================================================================

/**
 * POST /api/chat/highlight
 * Highlight a chat message for overlay display
 */
router.post("/highlight", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { roomId } = req.body;

        const schema = z.object({
            roomId: z.string().min(1),
            message: z.object({
                id: z.string(),
                authorName: z.string(),
                authorPhoto: z.string().optional(),
                message: z.string(),
                platform: z.enum(["youtube", "twitch", "facebook"]),
                isModerator: z.boolean().optional(),
                isOwner: z.boolean().optional(),
            }),
            duration: z.number().min(1000).max(60000).default(10000), // Duration in ms
        });

        const data = schema.parse(req.body);

        const highlightData = {
            ...data.message,
            timestamp: new Date(),
            expiresAt: Date.now() + data.duration,
        } as ChatMessage & { expiresAt: number };

        await setHighlight(data.roomId, highlightData, data.duration);

        console.log(`[CHAT] Highlighted message in room ${data.roomId}: "${data.message.message.substring(0, 50)}..."`);

        res.json({
            success: true,
            highlight: {
                ...data.message,
                expiresAt: Date.now() + data.duration,
            },
        });
    } catch (error: any) {
        console.error("[CHAT] Highlight error:", error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/chat/highlight/:roomId
 * Get the currently highlighted message for a room
 */
router.get("/highlight/:roomId", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const highlight = await getHighlight(roomId);

        if (!highlight || Date.now() > highlight.expiresAt) {
            // Clean up expired
            await deleteHighlight(roomId);
            return res.json({ highlight: null });
        }

        res.json({
            highlight: {
                id: highlight.id,
                authorName: highlight.authorName,
                authorPhoto: highlight.authorPhoto,
                message: highlight.message,
                platform: highlight.platform,
                isModerator: highlight.isModerator,
                isOwner: highlight.isOwner,
                expiresAt: highlight.expiresAt,
                remainingMs: highlight.expiresAt - Date.now(),
            },
        });
    } catch (error: any) {
        console.error("[CHAT] Get highlight error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/chat/highlight/:roomId
 * Remove the highlighted message
 */
router.delete("/highlight/:roomId", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        await deleteHighlight(roomId);

        console.log(`[CHAT] Removed highlight for room: ${roomId}`);

        res.json({ success: true });
    } catch (error: any) {
        console.error("[CHAT] Remove highlight error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
