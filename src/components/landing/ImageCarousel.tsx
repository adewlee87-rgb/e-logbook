"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "Document Work Daily with Photo Evidence",
    subtitle: "Real-time Logging on Mobile or Desktop",
    description:
      "Students capture activities, add notes, and attach photo evidence right from their workspace or smartphone.",
    image: "/auth/onboarding-1.jpg",
    tag: "Student Log Entry",
  },
  {
    id: 2,
    title: "Instant Supervisor Reviews & Stamping",
    subtitle: "Verifiable Review Workflow",
    description:
      "Supervisors view entries, leave detailed feedback comments, and stamp logs with one click.",
    image: "/auth/onboarding-2.jpg",
    tag: "Supervisor Portal",
  },
  {
    id: 3,
    title: "Internship Period Activity Summaries",
    subtitle: "Visual Progress & Statistics",
    description:
      "Track submission completion, days active, and generate exportable summaries for university assessment.",
    image: "/auth/onboarding-3.jpg",
    tag: "Activity Tracker",
  },
  {
    id: 4,
    title: "Resubmit & Fix Returned Logs",
    subtitle: "Seamless Corrections",
    description:
      "When a supervisor returns an entry, students get instant notifications to edit, correct observations, and resubmit.",
    image: "/auth/onboarding-5.jpg",
    tag: "Notifications & Updates",
  },
];

export function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  function handleNext() {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }

  function handlePrev() {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }

  const slide = SLIDES[current];

  return (
    <Section id="showcase">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#FCD34D] bg-[#FFFBEB] px-4 py-1.5 text-xs font-bold text-[#B45309]">
          Interactive App Showcase
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          See how Y&apos;ello Log works in action
        </h2>
        <p className="mt-3 text-[#666]">
          Swipe through key features of the digitized SIWES logbook platform.
        </p>
      </Reveal>

      <div
        className="mt-10 relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-2xl sm:p-6 lg:p-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-12">
          {/* Slide Copy */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div>
              <span className="inline-block rounded-full bg-[#FEF3D6] px-3.5 py-1 text-xs font-bold text-[#1A1A1A]">
                {slide.tag}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold text-[#1A1A1A] leading-snug">
                {slide.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-primary">
                {slide.subtitle}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[#666]">
                {slide.description}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrent(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === current
                        ? "w-8 bg-primary"
                        : "w-2.5 bg-gray-200 hover:bg-gray-300"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#1A1A1A] transition-colors hover:bg-gray-100 shadow-sm"
                  aria-label="Previous slide"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#1A1A1A] transition-colors hover:bg-gray-100 shadow-sm"
                  aria-label="Next slide"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Slide Image */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-lg bg-gray-50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={reduce ? false : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 p-3.5 backdrop-blur shadow-md">
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      {slide.title}
                    </p>
                    <p className="text-[11px] text-[#666]">
                      Y&apos;ello Log • {slide.tag}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
