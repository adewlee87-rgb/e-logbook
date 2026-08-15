import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { ProblemShift } from "@/components/landing/ProblemShift";
import { Features } from "@/components/landing/Features";
import { Roles } from "@/components/landing/Roles";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "e-log — Digitize your SIWES logbook",
  description:
    "e-log is the Universal E-Logbook for Nigerian universities. Log daily training activities with photo evidence, get supervisor approval, and export verifiable reports — no more paper logbook.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingNav />
      <Hero />
      <StatsStrip />
      <ProblemShift />
      <Features />
      <Roles />
      <HowItWorks />
      <DashboardPreview />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
