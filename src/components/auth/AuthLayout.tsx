"use client";

import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";

const slides = [
  {
    image: "/auth/onboarding-1.jpg",
    headline: "Log What You Learn",
    subtext:
      "Record your daily activities, lessons, and achievements as you progress through your SIWES experience.",
  },
  {
    image: "/auth/onboarding-2.jpg",
    headline: "Start Your Internship Journey",
    subtext:
      "Join thousands of students digitizing their industrial training experience from day one.",
  },
  {
    image: "/auth/onboarding-3.jpg",
    headline: "Stay Organized Throughout Your Training",
    subtext:
      "Manage activities, submit reports, and collaborate with supervisors from a single platform.",
  },
  {
    image: "/auth/onboarding-4.png",
    headline: "Capture Every Milestone",
    subtext:
      "Snap photos of your work as proof and attach them straight to your logbook entries.",
  },
  {
    image: "/auth/onboarding-5.jpg",
    headline: "Show Your Progress",
    subtext:
      "Add photos, reports, and project files to support the work you've done.",
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {slides.map((slide, i) => (
          <div
            key={slide.headline}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={i === 0}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-20 left-10 right-10">
              <h2 className="text-3xl font-bold leading-tight text-white">
                {slide.headline}
              </h2>
              <p className="mt-3 max-w-sm text-sm text-white/80">
                {slide.subtext}
              </p>
            </div>
          </div>
        ))}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
          {slides.map((slide, i) => (
            <span
              key={slide.headline}
              className={
                i === index
                  ? "h-2 w-6 rounded-full bg-[#FFC107]"
                  : "h-2 w-2 rounded-full bg-white/60"
              }
            />
          ))}
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[460px]">{children}</div>
      </div>
    </div>
  );
}
