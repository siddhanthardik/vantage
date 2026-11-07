import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";

interface CtaBannerProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  buttonVariant?: "gold" | "navy";
  className?: string;
}

export default function CtaBanner({
  title = "Let's Build Your Wealth Roadmap",
  description = "Talk to our advisors and get a personalised wealth plan for your goals.",
  buttonText = "Book a Consultation",
  buttonHref = "/consultation",
  buttonVariant = "gold",
  className = "",
}: CtaBannerProps) {
  return (
    <section className={`bg-[#172B46] text-[#FFFFFF] relative overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-11 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Left Title & Accent Bar */}
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="w-1 h-12 sm:h-14 bg-[#B08D57] shrink-0" />
            <div className="space-y-1">
              <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-semibold text-[#FFFFFF] tracking-tight leading-snug">
                {title}
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#F7F5F0]/85 font-normal">
                {description}
              </p>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0 flex items-center">
            {buttonVariant === "gold" ? (
              <Link
                href={buttonHref}
                className="inline-flex items-center gap-2.5 bg-[#B08D57] hover:bg-[#9B7A46] text-[#FFFFFF] px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm group"
              >
                <Calendar className="w-4 h-4 text-[#FFFFFF]" />
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4 text-[#FFFFFF] group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href={buttonHref}
                className="inline-flex items-center gap-2.5 border border-[#B08D57] bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] hover:text-[#FFFFFF] px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm group"
              >
                <Calendar className="w-4 h-4 text-[#C9A975] group-hover:text-[#FFFFFF] transition-colors" />
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4 text-[#C9A975] group-hover:text-[#FFFFFF] group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mountain Background Graphic */}
      <div className="absolute inset-y-0 left-0 w-2/5 sm:w-1/3 opacity-25 pointer-events-none">
        <Image
          src="/images/home/roadmap-banner.png"
          alt="Alpine background"
          fill
          sizes="(max-width: 640px) 40vw, 33vw"
          className="object-cover object-left"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#172B46]/60 to-[#172B46]" />
      </div>
    </section>
  );
}
