import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Clock, Calendar } from "lucide-react";
import { LinkedinIcon } from "@/components/ui/icons";
import ContactForm from "@/components/forms/ContactForm";
import SectionKicker from "@/components/ui/SectionKicker";
import CtaBanner from "@/components/ui/CtaBanner";
import { getBusinessSettings } from "@/server/repositories/serviceRepository";

export const metadata: Metadata = {
  title: "Contact Us | Vantage Wealth",
  description:
    "Let's build your wealth plan together. Reach out to Vantage Wealth for bespoke wealth management and financial advisory services.",
};

async function ContactDetailsBlock() {
  let settings = {
    phone: "+91 98765 43210",
    email: "hello@vantagewealth.in",
    address: "New Delhi, India",
  };

  try {
    settings = await getBusinessSettings();
  } catch (err) {
    console.error("Database connection failure loading contact details:", err);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#172B46]">
        Our Contact Details
      </h2>

      <div className="space-y-4">
        {/* Phone */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center shrink-0 text-[#B08D57]">
            <Phone className="w-5 h-5" />
          </div>
          <a
            href={`tel:${settings.phone.replace(/\s+/g, "")}`}
            className="text-base font-semibold text-[#172B46] hover:text-[#B08D57] transition-colors"
          >
            {settings.phone}
          </a>
        </div>

        {/* Email */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center shrink-0 text-[#B08D57]">
            <Mail className="w-5 h-5" />
          </div>
          <a
            href={`mailto:${settings.email}`}
            className="text-base font-semibold text-[#172B46] hover:text-[#B08D57] transition-colors"
          >
            {settings.email}
          </a>
        </div>

        {/* Location */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center shrink-0 text-[#B08D57]">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-base font-semibold text-[#172B46]">
            {settings.address}
          </span>
        </div>
      </div>

      <div className="border-t border-[#E5DFD5] pt-6 space-y-3">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#B08D57]" />
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#172B46]">
            Office Hours
          </h3>
        </div>
        <div className="space-y-1 pl-9 text-sm text-[#172B46]/80 font-normal">
          <p>Monday – Friday: 9:30 AM – 6:30 PM</p>
          <p>Saturday: 10:00 AM – 2:00 PM</p>
          <p className="text-xs text-[#172B46]/60 italic mt-1">(By prior appointment)</p>
        </div>
      </div>

      <div className="border-t border-[#E5DFD5] pt-6 space-y-3">
        <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#172B46]">
          Connect with Us
        </h3>
        <div className="flex items-center gap-3">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#172B46] hover:text-[#B08D57] transition-colors"
          >
            <div className="w-8 h-8 rounded-md bg-[#B08D57] text-[#FFFFFF] flex items-center justify-center">
              <LinkedinIcon className="w-4 h-4 text-[#FFFFFF]" />
            </div>
            <span>LinkedIn</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function ContactDetailsFallback() {
  return (
    <div className="space-y-6">
      <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#172B46]">
        Our Contact Details
      </h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center shrink-0 text-[#B08D57]">
            <Phone className="w-5 h-5" />
          </div>
          <span className="text-base font-semibold text-[#172B46]">+91 98765 43210</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center shrink-0 text-[#B08D57]">
            <Mail className="w-5 h-5" />
          </div>
          <span className="text-base font-semibold text-[#172B46]">hello@vantagewealth.in</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center shrink-0 text-[#B08D57]">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-base font-semibold text-[#172B46]">New Delhi, India</span>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="relative bg-[#FFFFFF]">
      {/* Light Hero Section matching Reference 1 */}
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-[#E5DFD5] overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <SectionKicker linePosition="right" textColor="#B08D57">
                CONTACT US
              </SectionKicker>

              <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-semibold text-[#172B46] leading-[1.15] tracking-tight">
                Let&apos;s Start a Conversation <br />
                About Your Wealth<span className="text-[#B08D57]">.</span>
              </h1>

              <div className="space-y-2 text-[15px] sm:text-[16px] text-[#172B46]/80 font-normal leading-relaxed max-w-xl">
                <p>
                  Every financial journey begins with understanding what matters to you.
                </p>
                <p>
                  Whether you are reviewing your investments, exploring financial protection, considering financing options or planning for retirement, our team is here to understand your requirements.
                </p>
                <p>
                  Share a little about your financial priorities and we will get in touch to discuss the next steps.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2.5 bg-[#B08D57] hover:bg-[#9B7A46] text-[#FFFFFF] text-sm font-semibold px-6 py-3.5 rounded-md transition-all duration-300 shadow-xs"
                >
                  <Calendar className="w-4 h-4 text-[#FFFFFF]" />
                  <span>Request a Consultation</span>
                </Link>
              </div>
            </div>

            {/* Right Background Graphic / Office Signage */}
            <div className="lg:col-span-5 hidden lg:block relative h-[260px] rounded-xl overflow-hidden shadow-sm border border-[#E5DFD5]">
              <Image
                src="/images/about/vantage-headquarters.png"
                alt="Vantage Wealth Headquarters"
                fill
                sizes="40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172B46]/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Form + Contact Details */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Get in Touch Form (7 Cols) */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>

            {/* Right Column: Contact Details, Hours, Social (5 Cols) */}
            <div className="lg:col-span-5 pt-2">
              <Suspense fallback={<ContactDetailsFallback />}>
                <ContactDetailsBlock />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner matching Reference 1 */}
      <CtaBanner
        title="Prefer a Personal Conversation?"
        description="Book a one-on-one consultation with our wealth advisor to discuss your goals and explore the right strategies."
        buttonText="Book a Consultation"
        buttonHref="/consultation"
      />
    </div>
  );
}
