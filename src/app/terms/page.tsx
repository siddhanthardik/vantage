import { Metadata } from "next";
import { FileText, AlertCircle, Scale, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Use | Vantage Wealth",
  description:
    "Terms of use and conditions governing the access and utilization of the Vantage Wealth platform and digital publications.",
};

export default function TermsPage() {
  return (
    <div className="relative bg-[#FFFFFF]">
      {/* Header */}
      <section className="py-16 sm:py-20 bg-[#172B46] text-[#F7F5F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            Platform Governance
          </span>
          <h1 className="text-[36px] sm:text-[42px] lg:text-[48px] font-semibold text-[#F7F5F0]">
            Terms of Use
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F5F0]/70 font-light max-w-xl mx-auto">
            Last Updated: January 2026 • Please read these terms carefully before utilizing this website
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-[#172B46]">
          {/* Owner Review Alert */}
          <div className="p-4 sm:p-5 bg-[#F7F5F0] border-l-4 border-[#B08D57] rounded-r-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <AlertCircle className="w-4 h-4 text-[#B08D57]" /> Legal Counsel Review Note
            </div>
            <p className="text-xs text-[#172B46]/75 font-light leading-relaxed">
              [OWNER REVIEW REQUIRED] These Terms of Use govern visitor access to the Vantage Wealth website. Formal client advisory engagements are governed by separate, mutually executed bilateral advisory agreements. Legal counsel should confirm applicable dispute resolution forums and statutory references prior to official deployment.
            </p>
          </div>

          <div className="space-y-8 text-sm font-light text-[#172B46]/85 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or utilizing the Vantage Wealth website (the &quot;Site&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Use and our associated Privacy Policy. If you do not concur with these terms, your sole recourse is to discontinue use of this platform immediately.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                2. No Advisory Relationship or Fiduciary Duty Formed
              </h2>
              <p>
                Accessing this website, reading articles, downloading commentary, or submitting an inquiry through our consultation forms does not constitute or establish an advisory relationship, client relationship, or fiduciary engagement between you and Vantage Wealth.
              </p>
              <p className="font-medium text-[#172B46]">
                A formal wealth advisory relationship is formed solely upon the thorough completion of know-your-customer (KYC) onboarding, risk assessment verification, and the mutual bilateral execution of a written Advisory Agreement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                3. Informational and Educational Nature of Content
              </h2>
              <p>
                All materials, articles, research summaries, and content published on this website are distributed strictly for general informational, educational, and awareness purposes. None of the materials on this website constitute:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#172B46]/80 text-xs sm:text-sm">
                <li>An offer, solicitation, or recommendation to buy, sell, or hold any financial instrument, security, fund, or insurance contract.</li>
                <li>Personalized investment, legal, accounting, tax, or estate planning advice.</li>
                <li>A guarantee, warranty, or representation concerning the performance or safety of any financial asset class or strategy.</li>
              </ul>
              <p>
                Financial decisions should be made only after reviewing your individual financial situation, risk capacity, and time horizon with a licensed professional advisor.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                4. Intellectual Property Rights
              </h2>
              <p>
                All trademarks, brand marks, logos, editorial texts, diagrams, photographs, software code, and visual layouts displayed on this website are the proprietary property of Vantage Wealth or used under appropriate licensing. No portion of this site may be reproduced, distributed, republished, or commercially exploited without the express prior written consent of Vantage Wealth.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                5. Limitation of Liability
              </h2>
              <p>
                While Vantage Wealth strives to maintain accurate and up-to-date information, the website content is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, whether express or implied.
              </p>
              <p>
                Vantage Wealth, its founders, directors, employees, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your access to, use of, or inability to access the website, or any reliance placed upon information contained herein.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                6. External Links & Third-Party Platforms
              </h2>
              <p>
                This website may contain hyperlinks to third-party resources, regulatory bodies, or market portals. These links are provided solely as a convenience. Vantage Wealth exercises no editorial control over third-party platforms and assumes no responsibility for their content, accuracy, or privacy practices.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                7. Governing Law and Jurisdiction
              </h2>
              <p>
                These Terms of Use shall be governed by and construed in accordance with the laws of India. Any legal disputes arising in connection with the access or use of this website shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                8. Modifications to Terms
              </h2>
              <p>
                Vantage Wealth reserves the right to modify or replace these Terms of Use at any time without prior notice. Continued use of the platform following the posting of modifications indicates your binding acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
