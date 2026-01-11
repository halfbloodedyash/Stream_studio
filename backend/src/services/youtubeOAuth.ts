import { google } from "googleapis";

// YouTube OAuth Configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "";
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "";
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "http://localhost:4000/api/chat/youtube/callback";

// Required scopes for YouTube Live Chat
const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
];

// In-memory token storage (use a database in production)
const tokenStore: Map<string, {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}> = new Map();

/**
 * YouTube OAuth Service
 * Handles OAuth2 authentication flow for YouTube API access
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
     * Exchange authorization code for tokens
     */
    async exchangeCode(code: string, userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
    }> {
        const { tokens } = await this.oauth2Client.getToken(code);

        const tokenData = {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            expiresAt: tokens.expiry_date || Date.now() + 3600000,
        };

        // Store tokens
        tokenStore.set(userId, tokenData);
        console.log(`[YOUTUBE] Stored tokens for user: ${userId}`);

        return tokenData;
    }

    /**
     * Get valid tokens for a user, refreshing if necessary
     */
    async getValidTokens(userId: string): Promise<string | null> {
        const tokens = tokenStore.get(userId);
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
                tokenStore.set(userId, tokens);

                return tokens.accessToken;
            } catch (error) {
                console.error(`[YOUTUBE] Token refresh failed:`, error);
                tokenStore.delete(userId);
                return null;
            }
        }

        return tokens.accessToken;
    }

    /**
     * Check if user is connected to YouTube
     */
    isConnected(userId: string): boolean {
        return tokenStore.has(userId);
    }

    /**
     * Disconnect user from YouTube
     */
    disconnect(userId: string): void {
        tokenStore.delete(userId);
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
