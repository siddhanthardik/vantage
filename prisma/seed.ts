import { PrismaClient, ServiceStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Vantage Wealth safe database seed (Create-if-Absent)...");

  const dataPath = path.join(process.cwd(), "src", "lib", "db", "services-data.json");
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Seed data file not found at ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, "utf-8");
  const { services, settings } = JSON.parse(rawData);

  // 1. Safe Seeding for Services: Create-if-Absent
  // Routine seed execution will NEVER overwrite content already edited in Admin Dashboard
  let servicesCreated = 0;
  let servicesPreserved = 0;

  for (const s of services) {
    const existing = await prisma.service.findUnique({
      where: { slug: s.slug },
    });

    if (existing) {
      console.log(`[SEED] Service "${s.slug}" already exists. Preserving existing CMS record.`);
      servicesPreserved++;
    } else {
      console.log(`[SEED] Creating missing service: "${s.slug}" (${s.title})...`);
      await prisma.service.create({
        data: {
          id: s.id,
          slug: s.slug,
          title: s.title,
          shortDesc: s.shortDesc,
          fullDesc: s.fullDesc,
          heroHeading: s.heroHeading,
          heroSubtext: s.heroSubtext,
          heroImage: s.heroImage,
          thumbnailImage: s.thumbnailImage,
          iconName: s.iconName,
          benefits: s.benefits,
          features: s.features,
          processSteps: s.processSteps,
          ctaHeading: s.ctaHeading,
          ctaButtonText: s.ctaButtonText,
          ctaButtonUrl: s.ctaButtonUrl,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          ogImage: s.ogImage,
          status: s.status as ServiceStatus,
          displayOrder: s.displayOrder,
        },
      });
      servicesCreated++;
    }
  }

  // 2. Safe Seeding for Business Settings: Create-if-Absent
  if (settings) {
    const existingSettings = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });

    if (existingSettings) {
      console.log("[SEED] BusinessSettings 'default' already exists. Preserving existing CMS settings.");
    } else {
      console.log("[SEED] Creating initial default BusinessSettings...");
      await prisma.businessSettings.create({
        data: {
          id: "default",
          companyName: settings.companyName || "Vantage Wealth",
          tagline: settings.tagline || "A Clearer Perspective on Your Wealth",
          phone: settings.phone || "+91 98765 43210",
          email: settings.email || "hello@vantagewealth.in",
          address: settings.address || "New Delhi, India",
          consultationUrl: settings.consultationUrl || "/consultation",
          copyrightNotice: settings.copyrightNotice || "© Vantage Wealth. All rights reserved.",
          heroHeading: "A Clearer Perspective on Your Wealth.",
          heroSubheading: "Integrated financial solutions to help you grow, protect and preserve your wealth.",
          heroNarrative:
            "At Vantage Wealth, we bring together investment solutions, financial protection, strategic financing, tax planning and retirement planning to help individuals and families make informed financial decisions.\n\nOur integrated approach is guided by three principles: Protect. Perform. Preserve.",
          heroImageUrl: "/images/home/hero-advisory.png",
          heroImageAlt: "Vantage Wealth Senior Advisory Counsel",
          heroImagePosition: "object-center",
          heroCtaText: "Book a Consultation",
          heroCtaUrl: "/consultation",
        },
      });
    }
  }

  console.log(`✅ Safe seed complete: ${servicesCreated} services created, ${servicesPreserved} existing services preserved intact.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
