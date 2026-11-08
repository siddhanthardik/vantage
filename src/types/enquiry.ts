export type EnquiryType = "CONTACT" | "CONSULTATION" | "CALLBACK";
export type EnquiryStatus = "NEW" | "CONTACTED" | "ARCHIVED";

export interface EnquiryItem {
  id: string;
  type: EnquiryType;
  fullName: string;
  email: string;
  phone: string;
  serviceSlug?: string | null;
  preferredMode?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  subject?: string | null;
  message: string;
  status: EnquiryStatus;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  hp_field?: string; // honeypot
}

export interface ConsultationFormData {
  fullName: string;
  email: string;
  phone: string;
  serviceSlug: string;
  preferredMode: "ONLINE" | "IN_PERSON";
  preferredDate: string;
  preferredTime: string;
  message?: string;
  hp_field?: string; // honeypot
}

export const ALLOWED_AREAS_OF_INTEREST = [
  "Investment Planning",
  "Portfolio Review",
  "Insurance & Risk Management",
  "Tax Advisory",
  "Retirement Planning",
  "Strategic Financing",
  "General Financial Planning",
] as const;

export type AreaOfInterest = (typeof ALLOWED_AREAS_OF_INTEREST)[number];

export interface CallbackFormData {
  fullName: string;
  phone: string;
  email?: string;
  areaOfInterest: string;
  preferredTime?: string;
  consent: boolean;
  articleSlug: string;
  articleTitle?: string;
  hp_field?: string; // honeypot
}
