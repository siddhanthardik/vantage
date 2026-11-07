import { cacheTag } from "next/cache";
import { ServiceItem, ServiceFormData, BusinessSettingsData } from "@/types/service";
import { prisma } from "@/lib/db/prisma";

/**
 * Canonical URL redirects for retired service slugs.
 * Ensures strict SEO preservation, no redirect loops, and proper fallback to /services
 * when no 1:1 canonical equivalent exists.
 */
export const SLUG_REDIRECTS: Record<string, string> = {
  "insurance": "/services/risk-management-insurance",
  "investment-advisory": "/services/investment-solutions",
  "tax-planning": "/services/tax-advisory",
  "loans": "/services/strategic-financing",
  "wealth-planning": "/services",
  "family-wealth-legacy": "/services",
};

/**
 * Sensible defaults matching the approved Vantage Wealth content.
 * Used if database row has not yet been seeded.
 */
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettingsData = {
  companyName: "Vantage Wealth",
  tagline: "A Clearer Perspective on Your Wealth",
  phone: "+91 98765 43210",
  email: "hello@vantagewealth.in",
  address: "New Delhi, India",
  consultationUrl: "/consultation",
  copyrightNotice: "© Vantage Wealth. All rights reserved.",
  heroHeading: "A Clearer Perspective on Your Wealth.",
  heroSubheading: "Integrated financial solutions to help you grow, protect and preserve your wealth.",
  heroNarrative:
    "At Vantage Wealth, we bring together investment solutions, financial protection, strategic financing, tax planning and retirement planning to help individuals and families make informed financial decisions.\n\nOur integrated approach is guided by three principles: Protect. Perform. Preserve.",
  heroImageUrl: "/images/home/hero-advisory.png",
  heroImageAlt: "Vantage Wealth Senior Advisory Counsel",
  heroImagePosition: "object-center",
  heroCtaText: "Book a Consultation",
  heroCtaUrl: "/consultation",
};

/**
 * PostgreSQL is the SINGLE authoritative source of truth for all published CMS services.
 * Runtime JSON fallback has been completely removed.
 * Returns an empty array if no services are published.
 * Throws an explicit error if database connection fails.
 */
export async function getPublishedServices(): Promise<ServiceItem[]> {
  "use cache";
  cacheTag("published-services");

  if (!prisma) {
    throw new Error("Database client unavailable: cannot query published services without PostgreSQL connection.");
  }

  const dbServices = await prisma.service.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { displayOrder: "asc" },
  });

  return (dbServices as unknown as ServiceItem[]) || [];
}

/**
 * Retrieves all services from PostgreSQL regardless of status.
 */
export async function getAllServices(): Promise<ServiceItem[]> {
  if (!prisma) {
    throw new Error("Database client unavailable: cannot query all services without PostgreSQL connection.");
  }

  const dbServices = await prisma.service.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (dbServices as unknown as ServiceItem[]) || [];
}

/**
 * Retrieves a single service by slug from PostgreSQL.
 * Returns null if not found.
 */
export async function getServiceBySlug(slug: string): Promise<ServiceItem | null> {
  "use cache";
  cacheTag(`service-${slug}`, "published-services");

  if (!prisma) {
    throw new Error("Database client unavailable: cannot query service without PostgreSQL connection.");
  }

  const cleanSlug = slug.trim().toLowerCase();

  const service = await prisma.service.findUnique({
    where: { slug: cleanSlug },
  });

  return (service as unknown as ServiceItem) || null;
}

/**
 * Retrieves a service by unique ID from PostgreSQL.
 */
export async function getServiceById(id: string): Promise<ServiceItem | null> {
  if (!prisma) {
    throw new Error("Database client unavailable: cannot query service by ID without PostgreSQL connection.");
  }

  const service = await prisma.service.findUnique({
    where: { id },
  });

  return (service as unknown as ServiceItem) || null;
}

/**
 * Creates a new service directly in PostgreSQL.
 */
export async function createService(formData: ServiceFormData): Promise<ServiceItem> {
  if (!prisma) {
    throw new Error("Database client unavailable: cannot create service without PostgreSQL connection.");
  }

  const now = new Date();
  const newSlug = formData.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");

  const newId = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const existing = await prisma.service.findUnique({ where: { slug: newSlug } });
  if (existing) {
    throw new Error(`A service with the slug "${newSlug}" already exists in PostgreSQL.`);
  }

  const maxOrderAgg = await prisma.service.aggregate({
    _max: { displayOrder: true },
  });
  const nextOrder =
    typeof formData.displayOrder === "number"
      ? formData.displayOrder
      : (maxOrderAgg._max.displayOrder || 0) + 1;

  const created = await prisma.service.create({
    data: {
      id: newId,
      slug: newSlug,
      title: formData.title.trim(),
      shortDesc: formData.shortDesc.trim(),
      fullDesc: formData.fullDesc || null,
      heroHeading: formData.heroHeading || formData.title.trim(),
      heroSubtext: formData.heroSubtext || formData.shortDesc.trim(),
      heroImage: formData.heroImage || "/images/services/investment-advisory-hero.png",
      thumbnailImage: formData.thumbnailImage || "/images/services/investment-advisory.png",
      iconName: formData.iconName || "LineChart",
      benefits: (formData.benefits as any) || [],
      features: (formData.features as any) || [],
      processSteps: (formData.processSteps as any) || [],
      contentSections: (formData.contentSections as any) || [],
      ctaHeading: formData.ctaHeading || `Let's Build Your ${formData.title.trim()} Plan`,
      ctaButtonText: formData.ctaButtonText || "Book a Consultation",
      ctaButtonUrl: formData.ctaButtonUrl || "/consultation",
      seoTitle: formData.seoTitle || `${formData.title.trim()} | Vantage Wealth`,
      seoDescription: formData.seoDescription || formData.shortDesc.trim(),
      ogImage: formData.ogImage || formData.heroImage || null,
      status: formData.status || "DRAFT",
      displayOrder: nextOrder,
      createdAt: now,
      updatedAt: now,
    },
  });

  return created as unknown as ServiceItem;
}

/**
 * Updates an existing service directly in PostgreSQL.
 */
export async function updateService(id: string, formData: Partial<ServiceFormData>): Promise<ServiceItem> {
  if (!prisma) {
    throw new Error("Database client unavailable: cannot update service without PostgreSQL connection.");
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Service with ID "${id}" does not exist in PostgreSQL.`);
  }

  let finalSlug = existing.slug;
  if (formData.slug && formData.slug !== existing.slug) {
    const checkSlug = formData.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const duplicate = await prisma.service.findFirst({
      where: { slug: checkSlug, NOT: { id } },
    });
    if (duplicate) {
      throw new Error(`Slug "${checkSlug}" is already in use by another service.`);
    }
    finalSlug = checkSlug;
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (formData.title !== undefined) updateData.title = formData.title.trim();
  if (formData.slug !== undefined) updateData.slug = finalSlug;
  if (formData.shortDesc !== undefined) updateData.shortDesc = formData.shortDesc.trim();
  if (formData.fullDesc !== undefined) updateData.fullDesc = formData.fullDesc || null;
  if (formData.heroHeading !== undefined) updateData.heroHeading = formData.heroHeading || null;
  if (formData.heroSubtext !== undefined) updateData.heroSubtext = formData.heroSubtext || null;
  if (formData.heroImage !== undefined) updateData.heroImage = formData.heroImage || null;
  if (formData.thumbnailImage !== undefined) updateData.thumbnailImage = formData.thumbnailImage || null;
  if (formData.iconName !== undefined) updateData.iconName = formData.iconName || null;
  if (formData.benefits !== undefined) updateData.benefits = formData.benefits;
  if (formData.features !== undefined) updateData.features = formData.features;
  if (formData.processSteps !== undefined) updateData.processSteps = formData.processSteps;
  if (formData.contentSections !== undefined) updateData.contentSections = formData.contentSections;
  if (formData.ctaHeading !== undefined) updateData.ctaHeading = formData.ctaHeading || null;
  if (formData.ctaButtonText !== undefined) updateData.ctaButtonText = formData.ctaButtonText || null;
  if (formData.ctaButtonUrl !== undefined) updateData.ctaButtonUrl = formData.ctaButtonUrl || null;
  if (formData.seoTitle !== undefined) updateData.seoTitle = formData.seoTitle || null;
  if (formData.seoDescription !== undefined) updateData.seoDescription = formData.seoDescription || null;
  if (formData.ogImage !== undefined) updateData.ogImage = formData.ogImage || null;
  if (formData.status !== undefined) updateData.status = formData.status;
  if (formData.displayOrder !== undefined) updateData.displayOrder = formData.displayOrder;

  const updated = await prisma.service.update({
    where: { id },
    data: updateData,
  });

  return updated as unknown as ServiceItem;
}

/**
 * Deletes a service from PostgreSQL.
 */
export async function deleteService(id: string): Promise<boolean> {
  if (!prisma) {
    throw new Error("Database client unavailable: cannot delete service without PostgreSQL connection.");
  }

  await prisma.service.delete({
    where: { id },
  });

  return true;
}

/**
 * Toggles service publish status in PostgreSQL.
 */
export async function togglePublishStatus(id: string): Promise<ServiceItem> {
  const service = await getServiceById(id);
  if (!service) throw new Error("Service not found in database.");

  const newStatus = service.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  return updateService(id, { status: newStatus });
}

/**
 * Reorders services in PostgreSQL.
 */
export async function reorderServices(orderedIds: string[]): Promise<void> {
  if (!prisma) {
    throw new Error("Database client unavailable: cannot reorder services without PostgreSQL connection.");
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.service.update({
      where: { id: orderedIds[i] },
      data: { displayOrder: i + 1 },
    });
  }
}

/**
 * Retrieves global Business Settings from PostgreSQL.
 * Includes complete Homepage Hero CMS configuration.
 * Returns sensible defaults if the database row is not yet initialized.
 * Throws an explicit error if database connection fails.
 */
export async function getBusinessSettings(): Promise<BusinessSettingsData> {
  "use cache";
  cacheTag("business-settings");

  if (!prisma) {
    throw new Error("Database client unavailable: cannot query business settings without PostgreSQL connection.");
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    return DEFAULT_BUSINESS_SETTINGS;
  }

  return {
    companyName: settings.companyName,
    tagline: settings.tagline,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    consultationUrl: settings.consultationUrl,
    copyrightNotice: settings.copyrightNotice,
    heroHeading: settings.heroHeading || DEFAULT_BUSINESS_SETTINGS.heroHeading,
    heroSubheading: settings.heroSubheading || DEFAULT_BUSINESS_SETTINGS.heroSubheading,
    heroNarrative: settings.heroNarrative || DEFAULT_BUSINESS_SETTINGS.heroNarrative,
    heroImageUrl: settings.heroImageUrl || DEFAULT_BUSINESS_SETTINGS.heroImageUrl,
    heroImageAlt: settings.heroImageAlt || DEFAULT_BUSINESS_SETTINGS.heroImageAlt,
    heroImagePosition: settings.heroImagePosition || DEFAULT_BUSINESS_SETTINGS.heroImagePosition,
    heroCtaText: settings.heroCtaText || DEFAULT_BUSINESS_SETTINGS.heroCtaText,
    heroCtaUrl: settings.heroCtaUrl || DEFAULT_BUSINESS_SETTINGS.heroCtaUrl,
  };
}

/**
 * Updates Business Settings and Homepage Hero configuration in PostgreSQL.
 */
export async function updateBusinessSettings(
  formData: Partial<BusinessSettingsData>
): Promise<BusinessSettingsData> {
  if (!prisma) {
    throw new Error("Database client unavailable: cannot update business settings without PostgreSQL connection.");
  }

  const updated = await prisma.businessSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      companyName: formData.companyName || DEFAULT_BUSINESS_SETTINGS.companyName,
      tagline: formData.tagline || DEFAULT_BUSINESS_SETTINGS.tagline,
      phone: formData.phone || DEFAULT_BUSINESS_SETTINGS.phone,
      email: formData.email || DEFAULT_BUSINESS_SETTINGS.email,
      address: formData.address || DEFAULT_BUSINESS_SETTINGS.address,
      consultationUrl: formData.consultationUrl || DEFAULT_BUSINESS_SETTINGS.consultationUrl,
      copyrightNotice: formData.copyrightNotice || DEFAULT_BUSINESS_SETTINGS.copyrightNotice,
      heroHeading: formData.heroHeading || DEFAULT_BUSINESS_SETTINGS.heroHeading,
      heroSubheading: formData.heroSubheading || DEFAULT_BUSINESS_SETTINGS.heroSubheading,
      heroNarrative: formData.heroNarrative || DEFAULT_BUSINESS_SETTINGS.heroNarrative,
      heroImageUrl: formData.heroImageUrl || DEFAULT_BUSINESS_SETTINGS.heroImageUrl,
      heroImageAlt: formData.heroImageAlt || DEFAULT_BUSINESS_SETTINGS.heroImageAlt,
      heroImagePosition: formData.heroImagePosition || DEFAULT_BUSINESS_SETTINGS.heroImagePosition,
      heroCtaText: formData.heroCtaText || DEFAULT_BUSINESS_SETTINGS.heroCtaText,
      heroCtaUrl: formData.heroCtaUrl || DEFAULT_BUSINESS_SETTINGS.heroCtaUrl,
    },
    update: {
      companyName: formData.companyName,
      tagline: formData.tagline,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      consultationUrl: formData.consultationUrl,
      copyrightNotice: formData.copyrightNotice,
      heroHeading: formData.heroHeading,
      heroSubheading: formData.heroSubheading,
      heroNarrative: formData.heroNarrative,
      heroImageUrl: formData.heroImageUrl,
      heroImageAlt: formData.heroImageAlt,
      heroImagePosition: formData.heroImagePosition,
      heroCtaText: formData.heroCtaText,
      heroCtaUrl: formData.heroCtaUrl,
    },
  });

  return {
    companyName: updated.companyName,
    tagline: updated.tagline,
    phone: updated.phone,
    email: updated.email,
    address: updated.address,
    consultationUrl: updated.consultationUrl,
    copyrightNotice: updated.copyrightNotice,
    heroHeading: updated.heroHeading,
    heroSubheading: updated.heroSubheading,
    heroNarrative: updated.heroNarrative,
    heroImageUrl: updated.heroImageUrl,
    heroImageAlt: updated.heroImageAlt,
    heroImagePosition: updated.heroImagePosition,
    heroCtaText: updated.heroCtaText,
    heroCtaUrl: updated.heroCtaUrl,
  };
}
