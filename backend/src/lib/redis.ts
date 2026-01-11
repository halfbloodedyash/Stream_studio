import Redis from "ioredis";

// Redis connection URL (set in environment)
const REDIS_URL = process.env.REDIS_URL || "";

// Singleton Redis client
let redis: Redis | null = null;

/**
 * Get the Redis client instance
 * Returns null if Redis is not configured or connection fails
 */
export function getRedis(): Redis | null {
    if (!REDIS_URL) {
        console.log("[REDIS] No REDIS_URL configured, using in-memory fallback");
        return null;
    }

    if (!redis) {
        try {
            redis = new Redis(REDIS_URL, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                retryStrategy: (times) => {
                    // Retry with exponential backoff, max 3 seconds
                    return Math.min(times * 100, 3000);
                },
            });

            redis.on("error", (err) => {
                console.error("[REDIS] Connection error:", err.message);
            });

            redis.on("connect", () => {
                console.log("[REDIS] ✓ Connected successfully");
            });

            redis.on("close", () => {
                console.log("[REDIS] Connection closed");
            });
        } catch (error) {
            console.error("[REDIS] Failed to initialize:", error);
            return null;
        }
    }

    return redis;
}

/**
 * Safely set a value in Redis with optional TTL
 * Falls back gracefully if Redis is unavailable
 */
export async function safeSet(
    key: string,
    value: string,
    ttlSeconds?: number
): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;

    try {
        if (ttlSeconds) {
            await client.set(key, value, "EX", ttlSeconds);
        } else {
            await client.set(key, value);
        }
        return true;
    } catch (error) {
        console.error("[REDIS] Set error:", error);
        return false;
    }
}

/**
 * Safely get a value from Redis
 * Returns null if Redis is unavailable or key doesn't exist
 */
export async function safeGet(key: string): Promise<string | null> {
    const client = getRedis();
    if (!client) return null;

    try {
        return await client.get(key);
    } catch (error) {
        console.error("[REDIS] Get error:", error);
        return null;
    }
}

/**
 * Safely delete a key from Redis
 */
export async function safeDel(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;

    try {
        await client.del(key);
        return true;
    } catch (error) {
        console.error("[REDIS] Del error:", error);
        return false;
    }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;

    try {
        await client.ping();
        return true;
    } catch {
        return false;
    }
}

export default redis;
