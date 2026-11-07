import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  Sprout,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Briefcase,
  FileText,
  UserCheck,
  HeartHandshake,
  Compass,
  Home,
  Target,
} from "lucide-react";
import SectionKicker from "@/components/ui/SectionKicker";

export const metadata: Metadata = {
  title: "Our Philosophy | Protect. Perform. Preserve. | Vantage Wealth",
  description:
    "Three Principles. One Integrated Financial Approach. Discover how Vantage Wealth balances wealth creation, financial protection, and long-term sustainability.",
};

export default function PhilosophyPage() {
  return (
    <div className="relative bg-[#FFFFFF] font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-[#E5DFD5] bg-gradient-to-b from-[#FAF8F5] to-[#FFFFFF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl space-y-5">
          <SectionKicker align="center" textColor="#B08D57">
            THE 3P PHILOSOPHY
          </SectionKicker>

          <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-semibold text-[#172B46] tracking-tight leading-[1.15]">
            Protect. Perform. Preserve<span className="text-[#B08D57]">.</span>
          </h1>

          <div className="text-[18px] sm:text-[20px] font-medium text-[#B08D57]">
            Three Principles. One Integrated Financial Approach.
          </div>

          <p className="text-[16px] sm:text-[17px] text-[#172B46]/80 font-normal leading-relaxed max-w-2xl mx-auto">
            At Vantage Wealth, we believe financial well-being requires a balance between wealth creation, financial protection and long-term financial security. Our 3P Philosophy brings together investment solutions, strategic financing, risk management, tax planning and retirement planning to support individuals and families through every stage of their financial journey.
          </p>

          <div className="pt-2 flex justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-7 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm group"
            >
              <span>Book a Consultation</span>
              <ArrowRight className="w-4 h-4 text-[#C9A975] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PROTECT SECTION */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="w-6 h-[1px] bg-[#B08D57]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08D57]">
                Principle 01
              </span>
            </div>
            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight leading-[1.2]">
              PROTECT | Safeguarding What Matters Most
            </h2>
            <p className="text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
              Financial security begins with understanding the risks that could affect your family, lifestyle, assets and financial commitments. We help assess protection requirements, identify potential gaps and facilitate access to suitable insurance solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Insurance Needs Assessment
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Evaluate existing insurance arrangements, financial responsibilities and potential protection gaps based on individual circumstances.
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <UserCheck className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Term Life Insurance
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Explore appropriate life cover to help protect dependants and long-term financial commitments.
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <HeartHandshake className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Health Insurance
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Assess healthcare protection requirements and explore suitable health insurance options.
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <Layers className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Other Insurance Solutions
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Facilitate access to additional insurance products based on individual needs and circumstances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PERFORM SECTION */}
      <section className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="w-6 h-[1px] bg-[#B08D57]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08D57]">
                Principle 02
              </span>
            </div>
            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight leading-[1.2]">
              PERFORM | Making Capital Work Towards Your Goals
            </h2>
            <p className="text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
              We believe financial performance involves more than selecting investments. It requires understanding your complete financial position, assessing opportunities, managing costs and aligning financial decisions with your objectives.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Domain 1: Investment Solutions */}
            <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-7 space-y-5 shadow-xs">
              <div className="flex items-center gap-3 text-[#B08D57]">
                <TrendingUp className="w-6 h-6 stroke-[1.5]" />
                <h3 className="text-[19px] font-semibold text-[#172B46]">
                  Investment Solutions &amp; Portfolio Advisory
                </h3>
              </div>

              <div className="space-y-4 text-[14px] text-[#172B46]/80 font-normal leading-relaxed">
                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Portfolio Consolidation &amp; Assessment
                  </strong>
                  Develop a consolidated view of investments, asset allocation, overlapping holdings, associated costs and concentration risks.
                </div>

                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Investment Solutions &amp; Execution
                  </strong>
                  Facilitate access to and execution of suitable investment products, including:
                  <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-[#172B46]/75">
                    <li>Mutual Funds</li>
                    <li>Specialized Investment Funds (SIFs)</li>
                    <li>Portfolio Management Services (PMS)</li>
                    <li>Alternative Investment Funds (AIFs)</li>
                  </ul>
                  <p className="text-xs text-[#172B46]/65 mt-2 italic">
                    Solutions are considered based on individual objectives, risk profile and applicable eligibility requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Domain 2: Tax Advisory */}
            <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-7 space-y-5 shadow-xs">
              <div className="flex items-center gap-3 text-[#B08D57]">
                <FileText className="w-6 h-6 stroke-[1.5]" />
                <h3 className="text-[19px] font-semibold text-[#172B46]">
                  Tax Advisory &amp; Tax Compliance
                </h3>
              </div>

              <div className="space-y-4 text-[14px] text-[#172B46]/80 font-normal leading-relaxed">
                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Tax Planning &amp; Optimisation
                  </strong>
                  Identify legitimate tax planning opportunities based on individual financial circumstances and consider tax implications when evaluating investment decisions.
                </div>

                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Income Tax Return Preparation
                  </strong>
                  Assist with the preparation of income tax returns through in-house and appropriately qualified external professionals.
                </div>

                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Income Tax Return Filing
                  </strong>
                  Facilitate income tax return filing and related compliance support.
                </div>
              </div>
            </div>

            {/* Domain 3: Strategic Financing */}
            <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-7 space-y-5 shadow-xs">
              <div className="flex items-center gap-3 text-[#B08D57]">
                <Briefcase className="w-6 h-6 stroke-[1.5]" />
                <h3 className="text-[19px] font-semibold text-[#172B46]">
                  Strategic Financing &amp; Liability Solutions
                </h3>
              </div>

              <div className="space-y-4 text-[14px] text-[#172B46]/80 font-normal leading-relaxed">
                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Structured Financing Solutions
                  </strong>
                  Explore financing options tailored to personal financial requirements, with attention to borrowing costs, repayment structures and efficient capital utilisation.
                </div>

                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Comprehensive Lending Solutions
                  </strong>
                  Facilitate access to Home Loans, Loans Against Property (LAP), Mortgage Loans, Balance Transfers, Working Capital Financing, and Debt Consolidation.
                </div>

                <div>
                  <strong className="text-[#172B46] font-semibold block mb-1">
                    Liquidity &amp; Liability Management
                  </strong>
                  Evaluate borrowing structures, repayment obligations and refinancing opportunities to support cash flow management.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRESERVE SECTION */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="w-6 h-[1px] bg-[#B08D57]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08D57]">
                Principle 03
              </span>
            </div>
            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight leading-[1.2]">
              PRESERVE | Securing Long-Term Financial Independence
            </h2>
            <p className="text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
              Building wealth is only one part of the financial journey. Ensuring that accumulated resources support future needs is equally important.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <Target className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Retirement Readiness &amp; Corpus Planning
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Estimate retirement funding requirements based on lifestyle expectations, inflation assumptions and financial goals.
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <TrendingUp className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Shortfall Analysis
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Evaluate projected retirement resources against expected requirements and identify potential funding gaps.
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <Layers className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Retirement Income Strategies
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Explore income-generation approaches, including Systematic Withdrawal Plans (SWPs), debt maturity ladders, and annuity options.
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-6 space-y-3 hover:border-[#B08D57] transition-all">
              <div className="w-10 h-10 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                <Sprout className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#172B46]">
                Financial Continuity
              </h3>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Review accumulated wealth and retirement strategies as circumstances, financial requirements and market conditions evolve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CLOSING CTA BANNER */}
      <section className="bg-[#172B46] text-[#FFFFFF] py-14 sm:py-18">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#C9A975]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A975]">
              Vantage Wealth
            </span>
            <span className="w-6 h-[1px] bg-[#C9A975]" />
          </div>

          <h2 className="text-[28px] sm:text-[32px] lg:text-[36px] font-semibold text-[#FFFFFF] tracking-tight">
            Protect what matters. Perform with purpose. Preserve for the future.
          </h2>

          <p className="text-[15px] sm:text-[16px] text-[#F7F5F0]/85 font-normal max-w-2xl mx-auto leading-relaxed">
            At Vantage Wealth, we believe informed financial decisions and an integrated approach can help individuals and families navigate their financial journeys with greater clarity and confidence.
          </p>

          <div className="pt-2">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 bg-[#B08D57] hover:bg-[#9B7A46] text-[#FFFFFF] px-8 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm group"
            >
              <Calendar className="w-4 h-4 text-[#FFFFFF]" />
              <span>Book a Consultation</span>
              <ArrowRight className="w-4 h-4 text-[#FFFFFF] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
