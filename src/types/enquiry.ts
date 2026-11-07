export type EnquiryType = "CONTACT" | "CONSULTATION";
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
