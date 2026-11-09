import Link from "next/link";
import { Compass, ArrowRight, Home } from "lucide-react";

export const metadata = {
  title: "Page Not Found | Vantage Wealth",
  description: "The requested page or wealth service could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#F7F5F0] py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-xl mx-auto text-center space-y-6 bg-[#FFFFFF] p-8 sm:p-12 rounded-sm border border-[#E5DFD5] shadow-lg">
        <div className="inline-flex p-3 rounded-full bg-[#B08D57]/10 text-[#B08D57]">
          <Compass className="w-8 h-8" />
        </div>
        <span className="block text-xs uppercase font-bold tracking-widest text-[#B08D57]">
          Error 404
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#172B46] tracking-tight">
          Page or Service Not Found
        </h1>
        <p className="text-sm text-[#172B46]/75 font-normal leading-relaxed">
          The requested page or wealth management practice could not be located. It may have been relocated, restructured, or is currently unpublished.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-xs w-full sm:w-auto justify-center"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 border border-[#B08D57] bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] px-5 py-2.5 rounded-sm text-xs font-semibold tracking-wider transition-colors w-full sm:w-auto justify-center"
          >
            <span>Explore All Services</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#B08D57]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
