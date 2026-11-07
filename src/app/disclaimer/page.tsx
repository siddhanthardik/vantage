import { Metadata } from "next";
import { ShieldAlert, AlertTriangle, FileCheck2, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Financial & Regulatory Disclaimer | Vantage Wealth",
  description:
    "Important regulatory disclosures regarding investment risk, market volatility, tax considerations, and non-guaranteed returns.",
};

export default function DisclaimerPage() {
  return (
    <div className="relative bg-[#FFFFFF]">
      {/* Header */}
      <section className="py-16 sm:py-20 bg-[#172B46] text-[#F7F5F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            Regulatory Disclosures & Risk Notice
          </span>
          <h1 className="text-[36px] sm:text-[42px] lg:text-[48px] font-semibold text-[#F7F5F0]">
            Financial Disclaimer
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F5F0]/70 font-light max-w-xl mx-auto">
            Last Updated: January 2026 • Essential notices regarding investment risks and regulatory parameters
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-[#172B46]">
          {/* Prominent Risk Highlight */}
          <div className="p-6 bg-[#F7F5F0] border-l-4 border-[#B08D57] rounded-r-sm space-y-3">
            <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-[#172B46]">
              <ShieldAlert className="w-5 h-5 text-[#B08D57] shrink-0" />
              General Risk Warning
            </div>
            <p className="text-xs sm:text-sm text-[#172B46]/85 font-light leading-relaxed">
              All investments in securities, mutual funds, debt structures, and financial assets are subject to market risks, including the potential loss of principal invested. Past performance is no indicator, promise, or guarantee of future returns. No material on this website constitutes a promise of assured gains, guaranteed returns, or capital preservation.
            </p>
          </div>

          {/* Owner Review Alert */}
          <div className="p-4 sm:p-5 bg-[#F7F5F0]/60 border border-[#E5DFD5] rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <AlertTriangle className="w-4 h-4 text-[#B08D57]" /> Compliance & Owner Verification Notice
            </div>
            <p className="text-xs text-[#172B46]/75 font-light leading-relaxed">
              [OWNER REVIEW REQUIRED] Prior to operating advisory or distribution activities under specific Indian financial frameworks, insert verified regulatory entity registration numbers (such as SEBI Registered Investment Advisor (RIA) registration number or AMFI Registration Number (ARN), if applicable). Do not claim regulatory licenses or certifications unless formally granted and in good standing.
            </p>
          </div>

          <div className="space-y-8 text-sm font-light text-[#172B46]/85 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                1. Informational Purpose Only
              </h2>
              <p>
                The information, charts, calculations, articles, and opinions expressed on this website are compiled for general educational and informational purposes only. They do not constitute personalized investment advice, a financial recommendation, an endorsement, or an offer or solicitation to purchase or sell any security, financial instrument, or portfolio strategy.
              </p>
              <p>
                Financial products and wealth planning methodologies should be evaluated based on your personal risk tolerance, financial horizon, liquidity requirements, and specific investment objectives.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                2. Market Volatility and Performance Disclosures
              </h2>
              <p>
                Financial markets are inherently volatile and influenced by macroeconomic factors, interest rate cycles, inflation trends, corporate earnings, and geopolitical events.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#172B46]/80 text-xs sm:text-sm">
                <li>Historical performance data, asset returns, or illustrative case scenarios do not assure future outcomes.</li>
                <li>The value of investments and any income derived from them may fluctuate downward as well as upward.</li>
                <li>Asset allocation and diversification strategies do not guarantee profits or protect against loss during severe market downturns.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                3. Tax, Accounting, and Legal Independence
              </h2>
              <p>
                Vantage Wealth does not provide certified legal counsel, formal accounting audits, or statutory tax filing representations. References to tax efficiencies, asset structuring, estate planning, or capital gains optimization are educational and illustrative.
              </p>
              <p>
                Tax legislation varies significantly by jurisdiction and is subject to retroactive revision. Clients are strongly advised to consult with their independent Chartered Accountant (CA), certified public accountant, or legal attorney regarding specific tax or legal considerations before executing transactions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                4. Third-Party Products & Distribution
              </h2>
              <p>
                Where solutions involve external products (such as mutual funds, life or health insurance policies, banking loans, or portfolio management services), these products are issued by respective third-party asset management companies, insurance underwriters, and lending institutions.
              </p>
              <p>
                All product terms, exclusions, charges, and conditions are governed solely by the respective issuing institutions’ scheme information documents and policy wordings. Investors must read all scheme-related documents carefully before investing.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                5. Written Advisory Agreements
              </h2>
              <p>
                Any specific advisory or portfolio management services provided by Vantage Wealth are governed exclusively by terms set forth in a separate, written, and mutually executed Advisory Agreement between Vantage Wealth and the client. In the event of any conflict between this website and the terms of an executed Advisory Agreement, the executed Advisory Agreement shall take precedence in all respects.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
