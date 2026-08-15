import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Consistent page-section container: centered max-width, responsive padding,
 * and scroll-margin so sticky-nav anchor jumps don't hide the heading.
 */
export function Section({ id, className = "", children }: SectionProps) {
  return (
    <section
      id={id}
      className={`mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      {children}
    </section>
  );
}
