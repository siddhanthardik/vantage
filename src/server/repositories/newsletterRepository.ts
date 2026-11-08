import { prisma } from "@/lib/db/prisma";
import { NewsletterSubscriberItem } from "@/types/newsletter";

export interface SubscribeResult {
  success: boolean;
  message: string;
  isNew: boolean;
  subscriber?: NewsletterSubscriberItem;
}

export interface UnsubscribeResult {
  success: boolean;
  message: string;
}

/**
 * Normalizes email address and validates general email structure.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 191;
}

/**
 * Subscribes a user to The Vantage Wealth Newsletter.
 * Records subscription consent and timestamp in PostgreSQL.
 * Handles idempotent duplicate submissions cleanly.
 */
export async function subscribeNewsletter(data: {
  name?: string;
  email: string;
  source?: string;
  sourceSlug?: string;
  ipAddress?: string;
}): Promise<SubscribeResult> {
  const cleanEmail = normalizeEmail(data.email);

  if (!isValidEmail(cleanEmail)) {
    throw new Error("Please provide a valid email address.");
  }

  const cleanName = data.name ? data.name.trim() : null;

  if (prisma) {
    try {
      const existing = await prisma.newsletterSubscriber.findUnique({
        where: { email: cleanEmail },
      });

      const now = new Date();

      if (existing) {
        if (existing.status === "SUBSCRIBED") {
          return {
            success: true,
            message: "You are already subscribed to The Vantage Wealth Newsletter.",
            isNew: false,
            subscriber: {
              ...existing,
              createdAt: existing.createdAt.toISOString(),
              updatedAt: existing.updatedAt.toISOString(),
              consentTimestamp: existing.consentTimestamp.toISOString(),
              unsubscribedAt: existing.unsubscribedAt ? existing.unsubscribedAt.toISOString() : null,
            },
          };
        }

        // Resubscribe previous unsubscriber
        const updated = await prisma.newsletterSubscriber.update({
          where: { email: cleanEmail },
          data: {
            status: "SUBSCRIBED",
            name: cleanName || existing.name,
            source: data.source || existing.source || "INSIGHTS_ARTICLE",
            sourceSlug: data.sourceSlug || existing.sourceSlug,
            consentGiven: true,
            consentTimestamp: now,
            unsubscribedAt: null,
            ipAddress: data.ipAddress || existing.ipAddress,
          },
        });

        return {
          success: true,
          message: "Welcome back! Your subscription to The Vantage Wealth Newsletter has been renewed.",
          isNew: false,
          subscriber: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            consentTimestamp: updated.consentTimestamp.toISOString(),
            unsubscribedAt: null,
          },
        };
      }

      // New subscriber
      const token = `unsub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const created = await prisma.newsletterSubscriber.create({
        data: {
          email: cleanEmail,
          name: cleanName,
          source: data.source || "INSIGHTS_ARTICLE",
          sourceSlug: data.sourceSlug || null,
          status: "SUBSCRIBED",
          consentGiven: true,
          consentTimestamp: now,
          unsubscribeToken: token,
          ipAddress: data.ipAddress || null,
        },
      });

      return {
        success: true,
        message: "Thank you for subscribing to The Vantage Wealth Newsletter.",
        isNew: true,
        subscriber: {
          ...created,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
          consentTimestamp: created.consentTimestamp.toISOString(),
          unsubscribedAt: null,
        },
      };
    } catch (e: any) {
      console.error("PostgreSQL subscribeNewsletter error:", e);
      throw new Error(`Failed to save newsletter subscription: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot subscribe without PostgreSQL connection.");
}

/**
 * Unsubscribe a user from the newsletter using their unique unsubscribe token.
 */
export async function unsubscribeNewsletterByToken(token: string): Promise<UnsubscribeResult> {
  if (!token || !token.trim()) {
    throw new Error("Invalid unsubscribe token.");
  }

  if (prisma) {
    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: token.trim() },
      });

      if (!subscriber) {
        return {
          success: false,
          message: "Subscription record not found or already removed.",
        };
      }

      if (subscriber.status === "UNSUBSCRIBED") {
        return {
          success: true,
          message: "You have already unsubscribed from The Vantage Wealth Newsletter.",
        };
      }

      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "You have been successfully unsubscribed from The Vantage Wealth Newsletter.",
      };
    } catch (e: any) {
      console.error("PostgreSQL unsubscribe error:", e);
      throw new Error("An error occurred while processing your unsubscribe request.");
    }
  }

  throw new Error("Database client not available.");
}
