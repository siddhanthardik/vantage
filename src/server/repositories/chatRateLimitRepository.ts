import { prisma } from "@/lib/db/prisma";

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetTime: Date;
  remaining: number;
}

/**
 * Shared, PM2-cluster compatible, PostgreSQL-backed atomic sliding-window rate limiter.
 * Operates across multi-worker Node.js processes without requiring Redis.
 */
export const chatRateLimitRepository = {
  /**
   * Check and increment rate limit counter for a specific key atomically in PostgreSQL.
   *
   * @param key Unique rate limiting identifier (e.g. `ip:hash` or `session:id`)
   * @param limit Maximum allowed requests within the time window
   * @param windowSeconds Window length in seconds (e.g. 60 for 1 minute)
   */
  async checkRateLimit(key: string, limit: number = 8, windowSeconds: number = 60): Promise<RateLimitResult> {
    try {
      const now = new Date();
      const newExpiresAt = new Date(Date.now() + windowSeconds * 1000);

      const results: any[] = await prisma.$queryRaw`
        INSERT INTO chat_rate_limit_buckets ("key", "count", "expiresAt", "createdAt")
        VALUES (
          ${key}, 
          1, 
          ${newExpiresAt}, 
          ${now}
        )
        ON CONFLICT ("key") DO UPDATE
        SET 
          "count" = CASE 
            WHEN chat_rate_limit_buckets."expiresAt" <= ${now} THEN 1 
            ELSE chat_rate_limit_buckets."count" + 1 
          END,
          "expiresAt" = CASE 
            WHEN chat_rate_limit_buckets."expiresAt" <= ${now} THEN ${newExpiresAt} 
            ELSE chat_rate_limit_buckets."expiresAt" 
          END
        RETURNING "count", "expiresAt";
      `;

      if (!results || results.length === 0) {
        // Fail open if unexpected empty return
        return {
          allowed: true,
          currentCount: 1,
          limit,
          resetTime: new Date(Date.now() + windowSeconds * 1000),
          remaining: limit - 1,
        };
      }

      const row = results[0];
      const currentCount = Number(row.count);
      const resetTime = new Date(row.expiresAt);
      const allowed = currentCount <= limit;
      const remaining = Math.max(0, limit - currentCount);

      return {
        allowed,
        currentCount,
        limit,
        resetTime,
        remaining,
      };
    } catch (error) {
      console.error("Rate limit check database error:", error);
      // Fail open to avoid blocking visitors in case of transient DB connectivity issue
      return {
        allowed: true,
        currentCount: 1,
        limit,
        resetTime: new Date(Date.now() + windowSeconds * 1000),
        remaining: limit - 1,
      };
    }
  },

  /**
   * Reset or clear a rate limit key (e.g. for testing or administrative unblocking)
   */
  async resetRateLimit(key: string): Promise<boolean> {
    try {
      await prisma.chatRateLimitBucket.deleteMany({
        where: { key },
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Cleanup stale expired rate-limit records in batches to keep table lean
   */
  async cleanupExpired(batchSize: number = 1000): Promise<number> {
    try {
      const result = await prisma.$executeRaw`
        DELETE FROM chat_rate_limit_buckets
        WHERE "key" IN (
          SELECT "key" FROM chat_rate_limit_buckets
          WHERE "expiresAt" < NOW()
          LIMIT ${batchSize}
        );
      `;
      return Number(result);
    } catch (error) {
      console.error("Rate limit cleanup error:", error);
      return 0;
    }
  },
};
