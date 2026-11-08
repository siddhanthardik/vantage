export type SubscriptionStatus = "SUBSCRIBED" | "UNSUBSCRIBED";

export interface NewsletterSubscriberItem {
  id: string;
  email: string;
  name?: string | null;
  source?: string | null;
  sourceSlug?: string | null;
  status: SubscriptionStatus;
  consentGiven: boolean;
  consentTimestamp: string;
  unsubscribedAt?: string | null;
  unsubscribeToken: string;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriptionFormData {
  name?: string;
  email: string;
  sourceSlug?: string;
  hp_field?: string; // honeypot
}
