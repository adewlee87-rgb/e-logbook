import { initials } from "@/lib/supervisor";

interface StudentAvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}

export function StudentAvatar({ name, url, size = 40, className = "" }: StudentAvatarProps) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#FEF3D6] font-semibold text-[#1A1A1A] ${className}`}
    >
      {initials(name)}
    </div>
  );
}
