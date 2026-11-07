import { Metadata } from "next";
import { Shield, Lock, FileText, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Vantage Wealth",
  description:
    "Privacy policy and data governance standards of Vantage Wealth. Learn how we safeguard your personal and financial information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative bg-[#FFFFFF]">
      {/* Header */}
      <section className="py-16 sm:py-20 bg-[#172B46] text-[#F7F5F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            Data Governance & Confidentiality
          </span>
          <h1 className="text-[36px] sm:text-[42px] lg:text-[48px] font-semibold text-[#F7F5F0]">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F5F0]/70 font-light max-w-xl mx-auto">
            Last Updated: January 2026 • Effective for all Vantage Wealth digital properties
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-[#172B46]">
          {/* Owner Review Alert */}
          <div className="p-4 sm:p-5 bg-[#F7F5F0] border-l-4 border-[#B08D57] rounded-r-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <AlertCircle className="w-4 h-4 text-[#B08D57]" /> Legal & Compliance Review Note
            </div>
            <p className="text-xs text-[#172B46]/75 font-light leading-relaxed">
              [OWNER REVIEW REQUIRED] The following privacy terms reflect standard Indian and international data protection practices for wealth advisory platforms. Please have your legal counsel verify corporate registration identifiers, local regulatory statutory details, and jurisdictional data handling requirements prior to final publication.
            </p>
          </div>

          <div className="space-y-8 text-sm font-light text-[#172B46]/85 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                1. Commitment to Client Confidentiality
              </h2>
              <p>
                At Vantage Wealth, safeguarding client trust is foundational to our advisory philosophy. We treat all personal, contact, and financial details shared with us as strictly confidential. This Privacy Policy outlines our procedures for collecting, utilizing, storing, and protecting personal information gathered across our website and direct communication desks.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                2. Information We Collect
              </h2>
              <p>
                We collect personal information solely when voluntarily provided by you through our digital touchpoints or direct advisory consultations:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#172B46]/80 text-xs sm:text-sm">
                <li>
                  <strong>Contact Information:</strong> Full name, telephone number, residential or business email address, and postal address.
                </li>
                <li>
                  <strong>Advisory Inquiries:</strong> Areas of interest (such as Investment Advisory, Wealth Planning, Retirement, or Tax Coordination), scheduling preferences, and contextual messages submitted through inquiry forms.
                </li>
                <li>
                  <strong>Technical Data:</strong> Anonymized web analytics, IP addresses, browser types, and access timestamps to ensure platform stability and prevent automated spam or fraudulent submissions.
                </li>
              </ul>
              <p>
                We do not collect sensitive banking credentials, passwords, or transaction PINs through our public website.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                3. Purpose and Use of Collected Information
              </h2>
              <p>Your information is utilized strictly for lawful advisory and business functions, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#172B46]/80 text-xs sm:text-sm">
                <li>Facilitating requested discovery sessions and responding to advisory inquiries.</li>
                <li>Transmitting curated market insights, research commentary, or firm updates if specifically subscribed to.</li>
                <li>Upholding risk management, fraud prevention, and information security safeguards.</li>
                <li>Complying with applicable statutory records retention and regulatory directives.</li>
              </ul>
              <p className="font-medium text-[#172B46]">
                We do not sell, rent, monetize, or commercialize your personal information with third-party advertising brokers or unaffiliated entities.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                4. Data Protection & Security Controls
              </h2>
              <p>
                We maintain appropriate physical, electronic, and procedural safeguards in line with industry best practices:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#172B46]/80 text-xs sm:text-sm">
                <li>Secure Sockets Layer / Transport Layer Security (TLS/SSL) encryption for all web traffic and form transmissions.</li>
                <li>Restricted internal access granted solely to authorized advisory and administrative personnel on a strict need-to-know basis.</li>
                <li>Isolated, access-controlled cloud and database infrastructure with continuous logging and vulnerability monitoring.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                5. Third-Party Service Providers
              </h2>
              <p>
                We may engage vetted technology service partners (such as database infrastructure hosting, cloud infrastructure providers, and transactional communication services) who process data strictly under our contractual confidentiality agreements. These partners are prohibited from utilizing your personal data for any purpose other than providing the agreed operational services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                6. Data Retention & Client Rights
              </h2>
              <p>
                We retain personal information only for as long as necessary to fulfill the purposes for which it was gathered, or to comply with statutory accounting and regulatory retention requirements.
              </p>
              <p>
                You maintain the right to inquire about what personal information we hold regarding you, request rectifications of inaccurate records, or request deletion of voluntary contact submissions, subject to applicable regulatory recordkeeping requirements.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                7. Contact for Privacy & Governance Matters
              </h2>
              <p>
                If you have questions regarding this Privacy Policy or wish to exercise data rights, please contact our administrative desk:
              </p>
              <div className="p-4 bg-[#F7F5F0] rounded-sm border border-[#E5DFD5] text-xs space-y-1">
                <p><strong>Vantage Wealth — Client Privacy Desk</strong></p>
                <p>Email: <a href="mailto:hello@vantagewealth.in" className="text-[#B08D57] underline">hello@vantagewealth.in</a></p>
                <p>Location: New Delhi, India</p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
