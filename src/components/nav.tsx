import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Home, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "今日", icon: Home },
  { to: "/week", label: "週期", icon: CalendarDays },
  { to: "/weight", label: "體重", icon: Scale },
  { to: "/skills", label: "技術", icon: BookOpen },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      aria-label="主導覽"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-muted"
                activeProps={{ className: "text-fg" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn("size-5", isActive && "text-accent")}
                      strokeWidth={1.75}
                    />
                    <span className="text-[11px] tracking-wide">
                      {item.label}
                    </span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
