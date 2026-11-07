-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "heroCtaText" TEXT NOT NULL DEFAULT 'Book a Consultation',
ADD COLUMN     "heroCtaUrl" TEXT NOT NULL DEFAULT '/consultation',
ADD COLUMN     "heroHeading" TEXT NOT NULL DEFAULT 'A Clearer Perspective on Your Wealth.',
ADD COLUMN     "heroImageAlt" TEXT NOT NULL DEFAULT 'Vantage Wealth Senior Advisory Counsel',
ADD COLUMN     "heroImagePosition" TEXT NOT NULL DEFAULT 'object-center',
ADD COLUMN     "heroImageUrl" TEXT NOT NULL DEFAULT '/images/home/hero-advisory.png',
ADD COLUMN     "heroNarrative" TEXT NOT NULL DEFAULT 'At Vantage Wealth, we bring together investment solutions, financial protection, strategic financing, tax planning and retirement planning to help individuals and families make informed financial decisions.

Our integrated approach is guided by three principles: Protect. Perform. Preserve.',
ADD COLUMN     "heroSubheading" TEXT NOT NULL DEFAULT 'Integrated financial solutions to help you grow, protect and preserve your wealth.';
