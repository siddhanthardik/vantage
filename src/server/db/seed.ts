import { prisma } from "@/lib/db/prisma";
import fs from "fs";
import path from "path";
import { hashPassword } from "@/lib/security/password";

/**
 * Vantage Wealth Database Seed & Sync Script
 * Idempotent: Can be run multiple times safely without duplicates or overwrites
 */
export async function seedDatabase() {
  if (!prisma) {
    console.log("No PostgreSQL Prisma client configured. DATABASE_URL is required to seed database.");
    return;
  }

  console.log("Beginning Vantage Wealth database synchronization...");

  try {
    // 1. Seed Business Settings
    const existingSettings = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });
    if (!existingSettings) {
      await prisma.businessSettings.create({
        data: {
          id: "default",
          companyName: "Vantage Wealth",
          tagline: "A Clearer Perspective on Your Wealth",
          phone: "+91 98765 43210",
          email: "hello@vantagewealth.in",
          address: "New Delhi, India",
          consultationUrl: "/consultation",
          copyrightNotice: "© Vantage Wealth. All rights reserved.",
        },
      });
      console.log("✓ Business Settings seeded");
    }

    // 2. Seed Default Categories
    const categories = [
      { name: "Wealth Planning", slug: "wealth-planning", description: "Bespoke wealth structuring and portfolio preservation strategies." },
      { name: "Investment Strategy", slug: "investment-strategy", description: "Disciplined capital allocation across global asset classes." },
      { name: "Tax & Legacy", slug: "tax-and-legacy", description: "Multi-generational estate planning and after-tax efficiency." },
      { name: "Retirement", slug: "retirement", description: "Long-term cash flow security and retirement readiness." },
      { name: "Market Updates", slug: "market-updates", description: "Macroeconomic commentary and market insights." },
    ];

    for (const cat of categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }
    console.log("✓ Categories synchronized");

    // 3. Seed Initial Services from services-data.json
    const servicesFilePath = path.join(process.cwd(), "src", "lib", "db", "services-data.json");
    if (fs.existsSync(servicesFilePath)) {
      const servicesData = JSON.parse(fs.readFileSync(servicesFilePath, "utf-8"));
      for (const s of servicesData.services || []) {
        await prisma.service.upsert({
          where: { slug: s.slug },
          update: {},
          create: {
            id: s.id,
            slug: s.slug,
            title: s.title,
            shortDesc: s.shortDesc,
            fullDesc: s.fullDesc || null,
            heroHeading: s.heroHeading || s.title,
            heroSubtext: s.heroSubtext || s.shortDesc,
            heroImage: s.heroImage,
            thumbnailImage: s.thumbnailImage,
            iconName: s.iconName || "LineChart",
            benefits: s.benefits || [],
            features: s.features || [],
            processSteps: s.processSteps || [],
            contentSections: s.contentSections || [],
            ctaHeading: s.ctaHeading,
            ctaButtonText: s.ctaButtonText || "Book a Consultation",
            ctaButtonUrl: s.ctaButtonUrl || "/consultation",
            seoTitle: s.seoTitle,
            seoDescription: s.seoDescription,
            ogImage: s.ogImage,
            status: s.status || "PUBLISHED",
            displayOrder: s.displayOrder || 0,
          },
        });
      }
      console.log(`✓ Synchronized ${servicesData.services?.length || 0} initial advisory services`);
    }

    // 4. Seed Initial Articles from articles-data.json
    const articlesFilePath = path.join(process.cwd(), "src", "lib", "db", "articles-data.json");
    if (fs.existsSync(articlesFilePath)) {
      const articlesData = JSON.parse(fs.readFileSync(articlesFilePath, "utf-8"));
      for (const a of articlesData.articles || []) {
        await prisma.article.upsert({
          where: { slug: a.slug },
          update: {},
          create: {
            id: a.id,
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            content: a.content,
            categoryName: a.category || "Wealth Planning",
            readTime: a.readTime || "5 min read",
            coverImage: a.coverImage,
            ogImage: a.ogImage || a.coverImage,
            authorName: a.authorName || "Vantage Research Desk",
            isFeatured: a.isFeatured || false,
            status: a.status || "PUBLISHED",
            publishedAt: new Date(a.publishedAt || Date.now()),
            seoTitle: a.seoTitle,
            seoDescription: a.seoDescription,
          },
        });
      }
      console.log(`✓ Synchronized ${articlesData.articles?.length || 0} initial articles`);
    }

    // 5. Seed Initial Admin User with Argon2id Password
    const defaultEmail = process.env.ADMIN_EMAIL || "admin@vantagewealth.in";
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: defaultEmail },
    });

    if (!existingAdmin) {
      const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || "VantageAdmin2026!";
      const passwordHash = await hashPassword(initialPassword);

      await prisma.adminUser.create({
        data: {
          email: defaultEmail,
          name: "Administrator",
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log(`✓ Initial Admin User created (${defaultEmail}) with secure Argon2id hash`);
    }

    console.log("Database synchronization completed successfully.");
  } catch (error) {
    console.error("Database seed failed:", error);
    throw error;
  }
}
