import { google } from "googleapis";
import { safeGet, safeSet, safeDel, isRedisAvailable } from "../lib/redis";

// YouTube OAuth Configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "";
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "";
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "http://localhost:4000/api/chat/youtube/callback";

// Required scopes for YouTube Live Chat
const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
];

// In-memory fallback (used when Redis is unavailable)
const memoryTokenStore: Map<string, {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}> = new Map();

// Redis key prefix and TTL
const REDIS_KEY_PREFIX = "youtube:tokens:";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

/**
 * YouTube OAuth Service
 * Handles OAuth2 authentication flow for YouTube API access
 * Uses Redis for persistent storage with in-memory fallback
 */
export class YouTubeOAuthService {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            YOUTUBE_CLIENT_ID,
            YOUTUBE_CLIENT_SECRET,
            YOUTUBE_REDIRECT_URI
        );
    }

    /**
     * Generate the OAuth2 authorization URL
     */
    getAuthUrl(userId: string): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
            state: userId, // Pass userId to identify the user on callback
            prompt: "consent", // Force consent to get refresh token
        });
    }

    /**
     * Store tokens (tries Redis first, falls back to memory)
     */
    private async storeTokens(userId: string, tokenData: TokenData): Promise<void> {
        const redisKey = `${REDIS_KEY_PREFIX}${userId}`;
        const stored = await safeSet(redisKey, JSON.stringify(tokenData), TOKEN_TTL_SECONDS);

        if (stored) {
            console.log(`[YOUTUBE] Stored tokens in Redis for user: ${userId}`);
        } else {
            // Fallback to in-memory
            memoryTokenStore.set(userId, tokenData);
            console.log(`[YOUTUBE] Stored tokens in memory for user: ${userId} (Redis unavailable)`);
        }
    }

    /**
     * Retrieve tokens (tries Redis first, falls back to memory)
     */
    private async getStoredTokens(userId: string): Promise<TokenData | null> {
        const redisKey = `${REDIS_KEY_PREFIX}${userId}`;
        const redisData = await safeGet(redisKey);

        if (redisData) {
            try {
                return JSON.parse(redisData) as TokenData;
            } catch {
                console.error(`[YOUTUBE] Failed to parse Redis token data for user: ${userId}`);
            }
        }

        // Fallback to in-memory
        return memoryTokenStore.get(userId) || null;
    }

    /**
     * Delete tokens from storage
     */
    private async deleteTokens(userId: string): Promise<void> {
        const redisKey = `${REDIS_KEY_PREFIX}${userId}`;
        await safeDel(redisKey);
        memoryTokenStore.delete(userId);
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCode(code: string, userId: string): Promise<TokenData> {
        const { tokens } = await this.oauth2Client.getToken(code);

        const tokenData: TokenData = {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            expiresAt: tokens.expiry_date || Date.now() + 3600000,
        };

        await this.storeTokens(userId, tokenData);

        return tokenData;
    }

    /**
     * Get valid tokens for a user, refreshing if necessary
     */
    async getValidTokens(userId: string): Promise<string | null> {
        const tokens = await this.getStoredTokens(userId);
        if (!tokens) {
            console.log(`[YOUTUBE] No tokens found for user: ${userId}`);
            return null;
        }

        // Check if token is expired (with 5 minute buffer)
        if (Date.now() > tokens.expiresAt - 300000) {
            console.log(`[YOUTUBE] Token expired, refreshing for user: ${userId}`);
            try {
                this.oauth2Client.setCredentials({
                    refresh_token: tokens.refreshToken,
                });
                const { credentials } = await this.oauth2Client.refreshAccessToken();

                // Update stored tokens
                tokens.accessToken = credentials.access_token!;
                tokens.expiresAt = credentials.expiry_date || Date.now() + 3600000;
                await this.storeTokens(userId, tokens);

                return tokens.accessToken;
            } catch (error) {
                console.error(`[YOUTUBE] Token refresh failed:`, error);
                await this.deleteTokens(userId);
                return null;
            }
        }

        return tokens.accessToken;
    }

    /**
     * Check if user is connected to YouTube
     */
    async isConnected(userId: string): Promise<boolean> {
        const tokens = await this.getStoredTokens(userId);
        return tokens !== null;
    }

    /**
     * Disconnect user from YouTube
     */
    async disconnect(userId: string): Promise<void> {
        await this.deleteTokens(userId);
        console.log(`[YOUTUBE] Disconnected user: ${userId}`);
    }

    /**
     * Get an authenticated OAuth2 client for API calls
     */
    async getAuthenticatedClient(userId: string) {
        const accessToken = await this.getValidTokens(userId);
        if (!accessToken) {
            throw new Error("User not authenticated with YouTube");
        }

        const client = new google.auth.OAuth2(
            YOUTUBE_CLIENT_ID,
            YOUTUBE_CLIENT_SECRET,
            YOUTUBE_REDIRECT_URI
        );
        client.setCredentials({ access_token: accessToken });
        return client;
    }
}

export const youtubeOAuthService = new YouTubeOAuthService();
