import { Router, Request, Response } from "express";
import { AccessToken, EgressClient, RoomServiceClient } from "livekit-server-sdk";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// LiveKit configuration from environment
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://your-livekit-server.livekit.cloud";

// Egress client for RTMP streaming
let egressClient: EgressClient | null = null;
let roomServiceClient: RoomServiceClient | null = null;

function getEgressClient(): EgressClient {
    if (!egressClient) {
        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            throw new Error("LiveKit not configured");
        }
        // Convert wss:// to https:// for API calls
        const apiUrl = LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://");
        egressClient = new EgressClient(apiUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    }
    return egressClient;
}

function getRoomServiceClient(): RoomServiceClient {
    if (!roomServiceClient) {
        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            throw new Error("LiveKit not configured");
        }
        const apiUrl = LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://");
        roomServiceClient = new RoomServiceClient(apiUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    }
    return roomServiceClient;
}

/**
 * Generate a LiveKit access token for a participant
 * POST /api/livekit/token
 */
router.post("/token", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { roomName, participantName, isHost = false } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ error: "roomName and participantName are required" });
        }

        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            return res.status(500).json({ error: "LiveKit not configured" });
        }

        // Create access token with 24 hour TTL for stability
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: userId || participantName,
            name: participantName,
            ttl: "24h", // 24 hours to prevent reconnection issues
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
    } catch (error) {
        console.error("Generate LiveKit token error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

/**
 * Generate a guest token (no auth required, but limited permissions)
 * POST /api/livekit/guest-token
 */
router.post("/guest-token", async (req: Request, res: Response) => {
    try {
        const { roomName, participantName } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ error: "roomName and participantName are required" });
        }

        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            return res.status(500).json({ error: "LiveKit not configured" });
        }

        // Create access token for guest with 6 hour TTL
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: `guest_${Date.now()}_${participantName}`,
            name: participantName,
            ttl: "6h", // 6 hours for guests
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
    } catch (error) {
        console.error("Generate guest token error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

/**
 * Start RTMP streaming (Egress) to YouTube/Twitch/etc
 * POST /api/livekit/egress/start-stream
 * 
 * Note: This requires LiveKit Egress to be configured on your LiveKit server.
 * For LiveKit Cloud, Egress is automatically available.
 * For self-hosted, you need to run the Egress service.
 * See: https://docs.livekit.io/egress/overview/
 */
router.post("/egress/start-stream", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { roomName, rtmpUrl, streamKey } = req.body;

        if (!roomName || !rtmpUrl || !streamKey) {
            return res.status(400).json({
                error: "roomName, rtmpUrl, and streamKey are required"
            });
        }

        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            return res.status(500).json({ error: "LiveKit not configured. Please set LIVEKIT_API_KEY and LIVEKIT_API_SECRET." });
        }

        const client = getEgressClient();

        // Build the full RTMP URL with stream key
        const fullRtmpUrl = rtmpUrl.endsWith('/')
            ? `${rtmpUrl}${streamKey}`
            : `${rtmpUrl}/${streamKey}`;

        console.log(`[EGRESS] Starting RTMP stream for room: ${roomName}`);
        console.log(`[EGRESS] RTMP URL: ${rtmpUrl}/***(hidden)`);

        // Start room composite egress to RTMP
        // This uses the dynamic import approach to avoid TypeScript issues with protobuf types
        const egressInfo = await (client as any).startRoomCompositeEgress(
            roomName,
            {
                stream: {
                    urls: [fullRtmpUrl],
                }
            },
            {
                layout: "grid",
            }
        );

        console.log(`[EGRESS] Stream started! Egress ID: ${egressInfo.egressId}`);

        res.json({
            success: true,
            egressId: egressInfo.egressId,
            status: egressInfo.status,
            message: "RTMP stream started successfully! Your video is now being sent to the destination.",
            rtmpUrl: rtmpUrl, // Don't expose stream key
        });

    } catch (error: any) {
        console.error("[EGRESS] Start stream error:", error);

        // Provide helpful error messages
        let errorMessage = error.message || "Failed to start RTMP stream";
        let details = "Make sure LiveKit Egress is configured and the room has active participants";

        if (error.message?.includes("not found")) {
            details = "The room was not found. Make sure you're in an active room before starting the stream.";
        } else if (error.message?.includes("egress") || error.message?.includes("Egress")) {
            details = "LiveKit Egress service may not be available. If using LiveKit Cloud, ensure Egress is enabled. If self-hosted, ensure the Egress service is running.";
        } else if (error.message?.includes("connection") || error.message?.includes("ECONNREFUSED")) {
            details = "Cannot connect to LiveKit server. Please check LIVEKIT_URL environment variable.";
        }

        res.status(500).json({ error: errorMessage, details });
    }
});

/**
 * Stop RTMP streaming
 * POST /api/livekit/egress/stop-stream
 */
router.post("/egress/stop-stream", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { egressId } = req.body;

        if (!egressId) {
            return res.status(400).json({ error: "egressId is required" });
        }

        const client = getEgressClient();

        console.log(`[EGRESS] Stopping stream: ${egressId}`);

        const egressInfo = await client.stopEgress(egressId);

        console.log(`[EGRESS] Stream stopped! Status: ${egressInfo.status}`);

        res.json({
            success: true,
            egressId: egressInfo.egressId,
            status: egressInfo.status,
            message: "RTMP stream stopped",
        });

    } catch (error: any) {
        console.error("[EGRESS] Stop stream error:", error);
        res.status(500).json({
            error: error.message || "Failed to stop RTMP stream"
        });
    }
});

/**
 * List active egress sessions
 * GET /api/livekit/egress/list
 */
router.get("/egress/list", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { roomName } = req.query;

        const client = getEgressClient();

        const egressList = await client.listEgress({
            roomName: roomName as string | undefined
        });

        res.json({
            egresses: egressList.map(e => ({
                egressId: e.egressId,
                roomName: e.roomName,
                status: e.status,
                startedAt: e.startedAt,
                endedAt: e.endedAt,
            })),
        });

    } catch (error: any) {
        console.error("[EGRESS] List egress error:", error);
        res.status(500).json({
            error: error.message || "Failed to list egress sessions"
        });
    }
});

/**
 * Get egress status
 * GET /api/livekit/egress/:egressId
 */
router.get("/egress/:egressId", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { egressId } = req.params;

        const client = getEgressClient();

        const egressList = await client.listEgress({
            egressId
        });

        if (egressList.length === 0) {
            return res.status(404).json({ error: "Egress not found" });
        }

        const egress = egressList[0];

        res.json({
            egressId: egress.egressId,
            roomName: egress.roomName,
            status: egress.status,
            startedAt: egress.startedAt,
            endedAt: egress.endedAt,
            error: egress.error,
        });

    } catch (error: any) {
        console.error("[EGRESS] Get egress error:", error);
        res.status(500).json({
            error: error.message || "Failed to get egress info"
        });
    }
});

/**
 * Start recording to file (requires S3 or GCS storage configuration)
 * POST /api/livekit/egress/start-recording
 */
router.post("/egress/start-recording", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { roomName, filepath } = req.body;

        if (!roomName) {
            return res.status(400).json({ error: "roomName is required" });
        }

        const client = getEgressClient();

        console.log(`[EGRESS] Starting recording for room: ${roomName}`);

        // Use dynamic typing to avoid TypeScript issues with protobuf
        const egressInfo = await (client as any).startRoomCompositeEgress(
            roomName,
            {
                file: {
                    filepath: filepath || `recordings/${roomName}-${Date.now()}.mp4`,
                }
            },
            {
                layout: "grid",
            }
        );

        console.log(`[EGRESS] Recording started! Egress ID: ${egressInfo.egressId}`);

        res.json({
            success: true,
            egressId: egressInfo.egressId,
            status: egressInfo.status,
            message: "Recording started",
        });

    } catch (error: any) {
        console.error("[EGRESS] Start recording error:", error);
        res.status(500).json({
            error: error.message || "Failed to start recording",
            details: "Recording requires storage configuration (S3, GCS, or local). Please check your LiveKit Egress setup."
        });
    }
});

export default router;
