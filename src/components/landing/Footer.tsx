"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Roles", href: "#roles" },
  { label: "FAQ", href: "#faq" },
];

const ROLE_LINKS = ["Students", "Supervisors", "Admins"];

const EASE = [0.22, 1, 0.36, 1] as const;

const parent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const col = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function Footer() {
  const year = 2026;
  const reduce = useReducedMotion();

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <motion.div
          className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
          variants={reduce ? undefined : parent}
          initial={reduce ? false : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Brand */}
          <motion.div variants={col}>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-[#1A1A1A]">
                Y
              </span>
              <span className="text-lg font-bold text-[#1A1A1A]">
                Y&apos;ello Log
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-[#666]">
              The Universal E-Logbook — digitizing SIWES industrial training for
              Nigerian universities.
            </p>
          </motion.div>

          {/* Product */}
          <motion.div variants={col}>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Product</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[#666] transition-colors hover:text-[#1A1A1A]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Roles */}
          <motion.div variants={col}>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Roles</h3>
            <ul className="mt-4 space-y-3">
              {ROLE_LINKS.map((label) => (
                <li key={label}>
                  <a
                    href="#roles"
                    className="text-sm text-[#666] transition-colors hover:text-[#1A1A1A]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Get started */}
          <motion.div variants={col}>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              Get started
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/signup"
                  className="text-sm text-[#666] transition-colors hover:text-[#1A1A1A]"
                >
                  Create an account
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-[#666] transition-colors hover:text-[#1A1A1A]"
                >
                  Log in
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@elogbook.app"
                  className="text-sm text-[#666] transition-colors hover:text-[#1A1A1A]"
                >
                  Contact us
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E5E7EB] pt-8 sm:flex-row">
          <p className="text-sm text-[#9CA3AF]">
            © {year} Y&apos;ello Log. All rights reserved.
          </p>
          <p className="text-sm text-[#9CA3AF]">Built for Internship.</p>
        </div>
      </div>
    </footer>
  );
}
