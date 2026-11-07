/**
 * Vantage Wealth — Official Typography System Tokens
 *
 * GLOBAL FONT RULE:
 * Manrope is the ONLY font family used across the entire application:
 * - Public Website (Headings, Paragraphs, Cards, Navigation, Footer, Forms)
 * - Admin Dashboard (Page Titles, Sections, Cards, Tables, Forms)
 * - Chatbot (Interface, Messages, Headers, Forms)
 *
 * No serif fonts (Cormorant Garamond, Georgia, Times New Roman) are permitted.
 */

export const TYPOGRAPHY = {
  font: {
    family: "var(--font-sans), 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  /**
   * Public Website Scale (Manrope Exclusively)
   * Hero H1: 42–48px, weight 600
   * Section H2: 30–34px, weight 600
   * H3: 22–24px, weight 600
   * Card headings: 18–20px, weight 600
   * Body: 16px, weight 400
   * Navigation: 14px, weight 500
   * Footer headings: 18px, weight 600
   * Footer links: 14px, weight 400
   */
  publicScale: {
    heroH1: {
      desktop: "clamp(2.625rem, 3.5vw, 3rem)", // 42–48px
      weight: 600,
      lineHeight: 1.15,
      tracking: "-0.015em",
    },
    sectionH2: {
      desktop: "clamp(1.875rem, 2.4vw, 2.125rem)", // 30–34px
      weight: 600,
      lineHeight: 1.25,
      tracking: "-0.01em",
    },
    h3: {
      desktop: "clamp(1.375rem, 1.8vw, 1.5rem)", // 22–24px
      weight: 600,
      lineHeight: 1.3,
      tracking: "-0.005em",
    },
    cardHeading: {
      desktop: "clamp(1.125rem, 1.4vw, 1.25rem)", // 18–20px
      weight: 600,
      lineHeight: 1.35,
    },
    body: {
      size: "1rem", // 16px
      weight: 400,
      lineHeight: 1.65,
    },
    navigation: {
      size: "0.875rem", // 14px
      weight: 500,
    },
    footerHeading: {
      size: "1.125rem", // 18px
      weight: 600,
    },
    footerLink: {
      size: "0.875rem", // 14px
      weight: 400,
    },
  },

  /**
   * Admin Dashboard Scale (Manrope Exclusively)
   * Page headings: 28–30px, weight 600
   * Section headings: 20–22px, weight 600
   * Card headings: 17–18px, weight 600
   * Body: 14–15px, weight 400
   * Tables: 13–14px
   */
  adminScale: {
    pageHeading: {
      desktop: "clamp(1.75rem, 2vw, 1.875rem)", // 28–30px
      weight: 600,
      lineHeight: 1.25,
    },
    sectionHeading: {
      desktop: "clamp(1.25rem, 1.5vw, 1.375rem)", // 20–22px
      weight: 600,
      lineHeight: 1.3,
    },
    cardHeading: {
      desktop: "clamp(1.0625rem, 1.2vw, 1.125rem)", // 17–18px
      weight: 600,
      lineHeight: 1.35,
    },
    body: {
      size: "0.90625rem", // 14.5px
      weight: 400,
      lineHeight: 1.55,
    },
    table: {
      size: "0.84375rem", // 13.5px
      lineHeight: 1.5,
    },
  },
} as const;
