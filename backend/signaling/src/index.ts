import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { createServer } from "http";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4001", 10);

// Types
interface Client {
    id: string;
    ws: WebSocket;
    roomId: string | null;
    userId: string | null;
    name: string;
    isHost: boolean;
}

interface Room {
    id: string;
    hostId: string;
    clients: Map<string, Client>;
    createdAt: Date;
}

interface SignalingMessage {
    type: string;
    payload?: any;
    to?: string;
    from?: string;
}

// State
const clients = new Map<string, Client>();
const rooms = new Map<string, Room>();

// Create HTTP server for health checks
const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            status: "ok",
            service: "Stream Studio Signaling Server",
            connections: clients.size,
            rooms: rooms.size,
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

server.listen(PORT, () => {
    console.log(`🚀 Signaling server running on port ${PORT}`);
    console.log(`   HTTP: http://localhost:${PORT}`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
});

wss.on("connection", (ws: WebSocket) => {
    const clientId = uuidv4();

    const client: Client = {
        id: clientId,
        ws,
        roomId: null,
        userId: null,
        name: "Anonymous",
        isHost: false,
    };

    clients.set(clientId, client);
    console.log(`Client connected: ${clientId}`);

    // Send client their ID
    sendMessage(ws, {
        type: "connected",
        payload: { clientId },
    });

    ws.on("message", (data: Buffer) => {
        try {
            const message: SignalingMessage = JSON.parse(data.toString());
            handleMessage(client, message);
        } catch (error) {
            console.error("Invalid message:", error);
        }
    });

    ws.on("close", () => {
        handleDisconnect(client);
        clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
    });

    ws.on("error", (error) => {
        console.error(`Client error ${clientId}:`, error);
    });
});

function handleMessage(client: Client, message: SignalingMessage) {
    switch (message.type) {
        case "create-room":
            handleCreateRoom(client, message.payload);
            break;

        case "join-room":
            handleJoinRoom(client, message.payload);
            break;

        case "leave-room":
            handleLeaveRoom(client);
            break;

        case "admit-guest":
            handleAdmitGuest(client, message.payload);
            break;

        case "remove-guest":
            handleRemoveGuest(client, message.payload);
            break;

        // WebRTC Signaling
        case "offer":
        case "answer":
        case "ice-candidate":
            handleWebRTCSignaling(client, message);
            break;

        // Media controls
        case "mute":
        case "unmute":
        case "video-on":
        case "video-off":
            handleMediaControl(client, message);
            break;

        case "chat":
            handleChat(client, message.payload);
            break;

        case "banner-update":
            handleBannerUpdate(client, message.payload);
            break;

        case "ping":
            sendMessage(client.ws, { type: "pong" });
            break;

        default:
            console.log("Unknown message type:", message.type);
    }
}

function handleCreateRoom(client: Client, payload: { roomId: string; userId: string; name: string }) {
    const { roomId, userId, name } = payload;

    // Check if room already exists
    if (rooms.has(roomId)) {
        sendMessage(client.ws, {
            type: "error",
            payload: { message: "Room already exists" },
        });
        return;
    }

    // Create room
    const room: Room = {
        id: roomId,
        hostId: client.id,
        clients: new Map(),
        createdAt: new Date(),
    };

    rooms.set(roomId, room);

    // Update client
    client.roomId = roomId;
    client.userId = userId;
    client.name = name;
    client.isHost = true;

    // Add client to room
    room.clients.set(client.id, client);

    sendMessage(client.ws, {
        type: "room-created",
        payload: { roomId },
    });

    console.log(`Room created: ${roomId} by ${client.id}`);
}

function handleJoinRoom(client: Client, payload: { roomId: string; name: string; inviteToken?: string }) {
    const { roomId, name, inviteToken } = payload;

    const room = rooms.get(roomId);
    if (!room) {
        sendMessage(client.ws, {
            type: "error",
            payload: { message: "Room not found" },
        });
        return;
    }

    // Update client
    client.roomId = roomId;
    client.name = name;
    client.isHost = false;

    // Add to room's waiting list
    room.clients.set(client.id, client);

    // Notify host about new guest
    const host = room.clients.get(room.hostId);
    if (host) {
        sendMessage(host.ws, {
            type: "guest-waiting",
            payload: {
                clientId: client.id,
                name: client.name,
            },
        });
    }

    // Notify client they're waiting
    sendMessage(client.ws, {
        type: "waiting-room",
        payload: { roomId },
    });

    console.log(`Client ${client.id} waiting to join room ${roomId}`);
}

function handleAdmitGuest(client: Client, payload: { guestId: string }) {
    if (!client.isHost || !client.roomId) return;

    const room = rooms.get(client.roomId);
    if (!room) return;

    const guest = room.clients.get(payload.guestId);
    if (!guest) return;

    // Notify guest they've been admitted
    sendMessage(guest.ws, {
        type: "admitted",
        payload: {
            roomId: room.id,
            participants: Array.from(room.clients.values())
                .filter((c) => c.id !== guest.id)
                .map((c) => ({
                    clientId: c.id,
                    name: c.name,
                    isHost: c.isHost,
                })),
        },
    });

    // Notify all other participants about new guest
    broadcastToRoom(room.id, {
        type: "participant-joined",
        payload: {
            clientId: guest.id,
            name: guest.name,
            isHost: false,
        },
    }, guest.id);

    console.log(`Guest ${guest.id} admitted to room ${room.id}`);
}

function handleRemoveGuest(client: Client, payload: { guestId: string }) {
    if (!client.isHost || !client.roomId) return;

    const room = rooms.get(client.roomId);
    if (!room) return;

    const guest = room.clients.get(payload.guestId);
    if (!guest) return;

    // remove guest from room
    room.clients.delete(payload.guestId);
    guest.roomId = null;

    // Notify guest
    sendMessage(guest.ws, {
        type: "removed",
        payload: { reason: "Removed by host" },
    });

    // Notify others
    broadcastToRoom(room.id, {
        type: "participant-left",
        payload: { clientId: guest.id },
    });

    console.log(`Guest ${guest.id} removed from room ${room.id}`);
}

function handleLeaveRoom(client: Client) {
    if (!client.roomId) return;

    const room = rooms.get(client.roomId);
    if (!room) return;

    room.clients.delete(client.id);

    // Notify others
    broadcastToRoom(room.id, {
        type: "participant-left",
        payload: { clientId: client.id },
    });

    // If host left, close the room
    if (client.isHost) {
        broadcastToRoom(room.id, {
            type: "room-closed",
            payload: { reason: "Host left" },
        });
        rooms.delete(room.id);
        console.log(`Room ${room.id} closed - host left`);
    }

    client.roomId = null;
    client.isHost = false;
}

function handleWebRTCSignaling(client: Client, message: SignalingMessage) {
    if (!client.roomId || !message.to) return;

    const room = rooms.get(client.roomId);
    if (!room) return;

    const target = room.clients.get(message.to);
    if (!target) return;

    // Forward the signaling message
    sendMessage(target.ws, {
        type: message.type,
        payload: message.payload,
        from: client.id,
    });
}

function handleMediaControl(client: Client, message: SignalingMessage) {
    if (!client.roomId) return;

    // Broadcast media state change to all participants
    broadcastToRoom(client.roomId, {
        type: message.type,
        payload: {
            clientId: client.id,
            ...message.payload,
        },
    }, client.id);
}

function handleChat(client: Client, payload: { message: string }) {
    if (!client.roomId) return;

    broadcastToRoom(client.roomId, {
        type: "chat",
        payload: {
            clientId: client.id,
            name: client.name,
            message: payload.message,
            timestamp: new Date().toISOString(),
        },
    });
}

function handleBannerUpdate(client: Client, payload: any) {
    if (!client.roomId) return;

    broadcastToRoom(client.roomId, {
        type: "banner-update",
        payload
    });
}

function handleDisconnect(client: Client) {
    if (client.roomId) {
        handleLeaveRoom(client);
    }
}

function sendMessage(ws: WebSocket, message: SignalingMessage) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

function broadcastToRoom(roomId: string, message: SignalingMessage, excludeClientId?: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.clients.forEach((client) => {
        if (client.id !== excludeClientId) {
            sendMessage(client.ws, message);
        }
    });
}

// Cleanup stale rooms periodically
setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    rooms.forEach((room, roomId) => {
        if (now - room.createdAt.getTime() > maxAge && room.clients.size === 0) {
            rooms.delete(roomId);
            console.log(`Cleaned up stale room: ${roomId}`);
        }
    });
}, 60 * 60 * 1000); // Check every hour
