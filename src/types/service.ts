export type ServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface ServiceBenefit {
  title: string;
  description: string;
  icon?: string;
}

export interface ServiceFeature {
  title: string;
  description: string;
  image?: string;
  icon?: string;
}

export interface ServiceProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface ServiceContentSection {
  heading: string;
  body: string;
  image?: string;
  order: number;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  fullDesc?: string | null;
  heroHeading?: string | null;
  heroSubtext?: string | null;
  heroImage?: string | null;
  thumbnailImage?: string | null;
  iconName?: string | null;
  benefits?: ServiceBenefit[] | null;
  features?: ServiceFeature[] | null;
  processSteps?: ServiceProcessStep[] | null;
  contentSections?: ServiceContentSection[] | null;
  ctaHeading?: string | null;
  ctaButtonText?: string | null;
  ctaButtonUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  status: ServiceStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFormData {
  slug: string;
  title: string;
  shortDesc: string;
  fullDesc?: string;
  heroHeading?: string;
  heroSubtext?: string;
  heroImage?: string;
  thumbnailImage?: string;
  iconName?: string;
  benefits?: ServiceBenefit[];
  features?: ServiceFeature[];
  processSteps?: ServiceProcessStep[];
  contentSections?: ServiceContentSection[];
  ctaHeading?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  status: ServiceStatus;
  displayOrder: number;
}

export interface BusinessSettingsData {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  consultationUrl: string;
  copyrightNotice: string;
  // Homepage Hero CMS
  heroHeading?: string;
  heroSubheading?: string;
  heroNarrative?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroImagePosition?: string;
  heroCtaText?: string;
  heroCtaUrl?: string;
}
