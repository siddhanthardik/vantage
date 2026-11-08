import fs from "fs";
import path from "path";
import { EnquiryItem, ContactFormData, ConsultationFormData, CallbackFormData } from "@/types/enquiry";
import { prisma } from "@/lib/db/prisma";

export const ALLOWED_AREAS_OF_INTEREST = [
  "Investment Planning",
  "Portfolio Review",
  "Insurance & Risk Management",
  "Tax Advisory",
  "Retirement Planning",
  "Strategic Financing",
  "General Financial Planning",
] as const;

const DATA_FILE_PATH = path.join(process.cwd(), "src", "lib", "db", "enquiries-data.json");

interface DataStore {
  enquiries: EnquiryItem[];
}

function readDataStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading enquiries data file:", error);
  }
  return { enquiries: [] };
}

function writeDataStore(data: DataStore): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing enquiries data file:", error);
  }
}

export async function createContactEnquiry(
  data: ContactFormData,
  ipAddress?: string
): Promise<EnquiryItem> {
  const now = new Date();
  const id = `enq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (prisma) {
    try {
      const created = await prisma.enquiry.create({
        data: {
          id,
          type: "CONTACT",
          fullName: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          subject: data.subject.trim(),
          message: data.message.trim(),
          status: "NEW",
          ipAddress: ipAddress || null,
          createdAt: now,
          updatedAt: now,
        },
      });

      const formatted: EnquiryItem = {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };

      const store = readDataStore();
      store.enquiries.unshift(formatted);
      writeDataStore(store);

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL createContactEnquiry failed:", e);
      throw new Error(`Database error saving contact enquiry: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot submit enquiry without PostgreSQL connection.");
}

export async function createConsultationEnquiry(
  data: ConsultationFormData,
  ipAddress?: string
): Promise<EnquiryItem> {
  const now = new Date();
  const id = `cns_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (prisma) {
    try {
      const created = await prisma.enquiry.create({
        data: {
          id,
          type: "CONSULTATION",
          fullName: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          serviceSlug: data.serviceSlug || "general-advisory",
          preferredMode: data.preferredMode || "ONLINE",
          preferredDate: data.preferredDate || null,
          preferredTime: data.preferredTime || null,
          message: data.message?.trim() || "Consultation discovery meeting requested.",
          status: "NEW",
          ipAddress: ipAddress || null,
          createdAt: now,
          updatedAt: now,
        },
      });

      const formatted: EnquiryItem = {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };

      const store = readDataStore();
      store.enquiries.unshift(formatted);
      writeDataStore(store);

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL createConsultationEnquiry failed:", e);
      throw new Error(`Database error saving consultation enquiry: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot submit consultation enquiry without PostgreSQL connection.");
}

export async function createCallbackEnquiry(
  data: CallbackFormData,
  ipAddress?: string
): Promise<{ enquiry: EnquiryItem; isDuplicate: boolean }> {
  const cleanName = data.fullName.trim();
  const cleanPhone = data.phone.trim();
  const cleanEmail = data.email ? data.email.trim().toLowerCase() : "";

  if (cleanName.length < 2) {
    throw new Error("Please enter your full name.");
  }

  // Validate phone: at least 8 digits, at most 15 digits
  const phoneDigits = cleanPhone.replace(/\D/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    throw new Error("Please enter a valid phone number (8 to 15 digits).");
  }

  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!data.consent) {
    throw new Error("You must agree to be contacted by Vantage Wealth to request a callback.");
  }

  if (!ALLOWED_AREAS_OF_INTEREST.includes(data.areaOfInterest as any)) {
    throw new Error("Please select a valid area of interest.");
  }

  const articleSlug = (data.articleSlug || "").trim();
  const now = new Date();

  if (prisma) {
    // Check duplicate in last 15 minutes with same phone & article
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentDuplicate = await prisma.enquiry.findFirst({
      where: {
        phone: cleanPhone,
        serviceSlug: articleSlug,
        type: "CALLBACK",
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    if (recentDuplicate) {
      return {
        enquiry: {
          ...recentDuplicate,
          createdAt: recentDuplicate.createdAt.toISOString(),
          updatedAt: recentDuplicate.updatedAt.toISOString(),
        },
        isDuplicate: true,
      };
    }

    const id = `clb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subject = `Insight Callback: ${data.areaOfInterest} [${articleSlug}]`;
    const message = `Area of Interest: ${data.areaOfInterest}\nPreferred Time: ${data.preferredTime || "Anytime"}\nSource Article: /insights/${articleSlug}\nConsent Recorded: Yes (${now.toISOString()})`;

    try {
      const created = await prisma.enquiry.create({
        data: {
          id,
          type: "CALLBACK",
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          serviceSlug: articleSlug,
          preferredMode: "PHONE",
          preferredTime: data.preferredTime || "Anytime",
          subject,
          message,
          status: "NEW",
          ipAddress: ipAddress || null,
          createdAt: now,
          updatedAt: now,
        },
      });

      const formatted: EnquiryItem = {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };

      const store = readDataStore();
      store.enquiries.unshift(formatted);
      writeDataStore(store);

      return { enquiry: formatted, isDuplicate: false };
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL createCallbackEnquiry failed:", e);
      throw new Error(`Database error saving callback request: ${e.message}`);
    }
  }

  throw new Error("Database client not available.");
}

export async function getAllEnquiries(): Promise<EnquiryItem[]> {
  if (prisma) {
    try {
      const dbEnquiries = await prisma.enquiry.findMany({
        orderBy: { createdAt: "desc" },
      });
      return dbEnquiries.map((e: any) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }));
    } catch (e) {
      console.error("PostgreSQL getAllEnquiries query error:", e);
      throw new Error("Failed to query enquiries from PostgreSQL.");
    }
  }

  const store = readDataStore();
  return store.enquiries;
}

export async function getEnquiryById(id: string): Promise<EnquiryItem | null> {
  if (prisma) {
    try {
      const item = await prisma.enquiry.findUnique({ where: { id } });
      if (!item) return null;
      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    } catch (e) {
      console.error("PostgreSQL getEnquiryById error:", e);
      throw new Error(`Failed to query enquiry ID "${id}" from PostgreSQL.`);
    }
  }

  const store = readDataStore();
  return store.enquiries.find((e) => e.id === id) || null;
}

export async function updateEnquiryStatus(
  id: string,
  status: "NEW" | "CONTACTED" | "ARCHIVED"
): Promise<EnquiryItem | null> {
  if (prisma) {
    try {
      const updated = await prisma.enquiry.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      });

      const formatted: EnquiryItem = {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      const store = readDataStore();
      const index = store.enquiries.findIndex((e) => e.id === id);
      if (index !== -1) {
        store.enquiries[index] = formatted;
        writeDataStore(store);
      }

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL updateEnquiryStatus failed:", e);
      throw new Error(`Database error updating enquiry status: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot update enquiry status without PostgreSQL connection.");
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  if (prisma) {
    const existing = await prisma.enquiry.findUnique({ where: { id } });
    if (!existing) return false;

    try {
      await prisma.enquiry.delete({ where: { id } });

      const store = readDataStore();
      store.enquiries = store.enquiries.filter((e) => e.id !== id);
      writeDataStore(store);

      return true;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL deleteEnquiry failed:", e);
      throw new Error(`Database error deleting enquiry: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot delete enquiry without PostgreSQL connection.");
}
