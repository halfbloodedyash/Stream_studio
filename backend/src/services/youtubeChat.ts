import { google, youtube_v3 } from "googleapis";
import { youtubeOAuthService } from "./youtubeOAuth";

export interface ChatMessage {
    id: string;
    authorName: string;
    authorPhoto: string;
    message: string;
    timestamp: Date;
    platform: "youtube";
    isModerator?: boolean;
    isOwner?: boolean;
    isMember?: boolean;
    memberLevel?: string;
    superChatAmount?: string;
}

export interface LiveBroadcast {
    id: string;
    title: string;
    description: string;
    liveChatId: string;
    status: string;
    scheduledStartTime?: Date;
    actualStartTime?: Date;
    concurrentViewers?: number;
    thumbnailUrl?: string;
}

/**
 * YouTube Chat Service
 * Fetches live chat messages from YouTube Live streams
 */
export class YouTubeChatService {
    private youtube: youtube_v3.Youtube | null = null;
    private nextPageToken: Map<string, string> = new Map();

    /**
     * Initialize YouTube API client for a user
     */
    private async getYouTubeClient(userId: string): Promise<youtube_v3.Youtube> {
        const authClient = await youtubeOAuthService.getAuthenticatedClient(userId);
        return google.youtube({ version: "v3", auth: authClient });
    }

    /**
     * Get the user's active live broadcasts
     */
    async getActiveBroadcasts(userId: string): Promise<LiveBroadcast[]> {
        try {
            const youtube = await this.getYouTubeClient(userId);

            const response = await youtube.liveBroadcasts.list({
                part: ["snippet", "status", "statistics"],
                broadcastStatus: "active", // Get currently active broadcasts
                broadcastType: "all",
            });

            const broadcasts: LiveBroadcast[] = (response.data.items || []).map(item => ({
                id: item.id!,
                title: item.snippet?.title || "Untitled Stream",
                description: item.snippet?.description || "",
                liveChatId: item.snippet?.liveChatId || "",
                status: item.status?.lifeCycleStatus || "unknown",
                scheduledStartTime: item.snippet?.scheduledStartTime
                    ? new Date(item.snippet.scheduledStartTime)
                    : undefined,
                actualStartTime: item.snippet?.actualStartTime
                    ? new Date(item.snippet.actualStartTime)
                    : undefined,
                concurrentViewers: parseInt(item.statistics?.concurrentViewers || "0"),
                thumbnailUrl: item.snippet?.thumbnails?.high?.url ||
                    item.snippet?.thumbnails?.default?.url,
            }));

            console.log(`[YOUTUBE_CHAT] Found ${broadcasts.length} active broadcasts for user ${userId}`);
            return broadcasts;

        } catch (error: any) {
            console.error(`[YOUTUBE_CHAT] Error fetching broadcasts:`, error.message);
            throw new Error(`Failed to fetch broadcasts: ${error.message}`);
        }
    }

    /**
     * Get upcoming broadcasts (scheduled but not started)
     */
    async getUpcomingBroadcasts(userId: string): Promise<LiveBroadcast[]> {
        try {
            const youtube = await this.getYouTubeClient(userId);

            const response = await youtube.liveBroadcasts.list({
                part: ["snippet", "status"],
                broadcastStatus: "upcoming",
                broadcastType: "all",
            });

            return (response.data.items || []).map(item => ({
                id: item.id!,
                title: item.snippet?.title || "Untitled Stream",
                description: item.snippet?.description || "",
                liveChatId: item.snippet?.liveChatId || "",
                status: item.status?.lifeCycleStatus || "unknown",
                scheduledStartTime: item.snippet?.scheduledStartTime
                    ? new Date(item.snippet.scheduledStartTime)
                    : undefined,
                thumbnailUrl: item.snippet?.thumbnails?.default?.url,
            }));

        } catch (error: any) {
            console.error(`[YOUTUBE_CHAT] Error fetching upcoming broadcasts:`, error.message);
            throw new Error(`Failed to fetch upcoming broadcasts: ${error.message}`);
        }
    }

    /**
     * Fetch live chat messages for a broadcast
     */
    async getChatMessages(
        userId: string,
        liveChatId: string,
        maxResults: number = 100
    ): Promise<{ messages: ChatMessage[]; pollingIntervalMs: number }> {
        try {
            const youtube = await this.getYouTubeClient(userId);

            // Get the page token for this chat (for pagination/continuation)
            const pageToken = this.nextPageToken.get(liveChatId);

            const response = await youtube.liveChatMessages.list({
                liveChatId,
                part: ["snippet", "authorDetails"],
                maxResults,
                pageToken,
            });

            // Store the next page token for subsequent calls
            if (response.data.nextPageToken) {
                this.nextPageToken.set(liveChatId, response.data.nextPageToken);
            }

            const messages: ChatMessage[] = (response.data.items || []).map(item => ({
                id: item.id!,
                authorName: item.authorDetails?.displayName || "Unknown",
                authorPhoto: item.authorDetails?.profileImageUrl || "",
                message: item.snippet?.displayMessage ||
                    item.snippet?.textMessageDetails?.messageText || "",
                timestamp: new Date(item.snippet?.publishedAt || Date.now()),
                platform: "youtube" as const,
                isModerator: item.authorDetails?.isChatModerator || false,
                isOwner: item.authorDetails?.isChatOwner || false,
                isMember: item.authorDetails?.isChatSponsor || false,
                memberLevel: item.authorDetails?.badgeUrl || undefined,
                superChatAmount: item.snippet?.superChatDetails?.amountDisplayString,
            }));

            // YouTube recommends polling at the interval they specify
            const pollingIntervalMs = response.data.pollingIntervalMillis || 5000;

            console.log(`[YOUTUBE_CHAT] Fetched ${messages.length} messages, next poll in ${pollingIntervalMs}ms`);

            return { messages, pollingIntervalMs };

        } catch (error: any) {
            console.error(`[YOUTUBE_CHAT] Error fetching chat messages:`, error.message);

            // Handle quota exceeded
            if (error.code === 403) {
                throw new Error("YouTube API quota exceeded. Please try again later.");
            }

            // Handle invalid chat ID (broadcast ended)
            if (error.code === 404 || error.message?.includes("liveChatEnded")) {
                throw new Error("Live chat has ended or is not available.");
            }

            throw new Error(`Failed to fetch chat messages: ${error.message}`);
        }
    }

    /**
     * Send a message to the live chat
     */
    async sendMessage(userId: string, liveChatId: string, message: string): Promise<ChatMessage> {
        try {
            const youtube = await this.getYouTubeClient(userId);

            const response = await youtube.liveChatMessages.insert({
                part: ["snippet"],
                requestBody: {
                    snippet: {
                        liveChatId,
                        type: "textMessageEvent",
                        textMessageDetails: {
                            messageText: message,
                        },
                    },
                },
            });

            const item = response.data;
            return {
                id: item.id!,
                authorName: item.authorDetails?.displayName || "You",
                authorPhoto: item.authorDetails?.profileImageUrl || "",
                message: item.snippet?.textMessageDetails?.messageText || message,
                timestamp: new Date(),
                platform: "youtube",
                isOwner: true,
            };

        } catch (error: any) {
            console.error(`[YOUTUBE_CHAT] Error sending message:`, error.message);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    /**
     * Get user's YouTube channel info
     */
    async getChannelInfo(userId: string): Promise<{
        id: string;
        title: string;
        thumbnail: string;
        subscriberCount: string;
    } | null> {
        try {
            const youtube = await this.getYouTubeClient(userId);

            const response = await youtube.channels.list({
                part: ["snippet", "statistics"],
                mine: true,
            });

            const channel = response.data.items?.[0];
            if (!channel) return null;

            return {
                id: channel.id!,
                title: channel.snippet?.title || "Unknown Channel",
                thumbnail: channel.snippet?.thumbnails?.default?.url || "",
                subscriberCount: channel.statistics?.subscriberCount || "0",
            };

        } catch (error: any) {
            console.error(`[YOUTUBE_CHAT] Error fetching channel info:`, error.message);
            return null;
        }
    }

    /**
     * Clear the page token for a chat (reset pagination)
     */
    resetChatPagination(liveChatId: string): void {
        this.nextPageToken.delete(liveChatId);
    }
}

export const youtubeChatService = new YouTubeChatService();
