import Link from "next/link";

const NAV_TRAIL = [
  { label: "Dashboard", href: "/student" },
  { label: "Report", href: "/student/report" },
  { label: "Profile", href: "/student/profile" },
  { label: "Settings", href: "/student/settings" },
];

export function Breadcrumb({ current }: { current: string }) {
  const currentIndex = NAV_TRAIL.findIndex((item) => item.href === current);
  const items = currentIndex === -1 ? NAV_TRAIL : NAV_TRAIL.slice(0, currentIndex + 1);

  return (
    <div className="flex flex-wrap items-center gap-2 text-lg sm:text-xl">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-[#9CA3AF]">›</span>}
            {isLast ? (
              <span className="font-medium text-[#1A1A1A]">{item.label}</span>
            ) : (
              <Link href={item.href} className="font-medium text-[#9CA3AF] hover:text-[#666]">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
