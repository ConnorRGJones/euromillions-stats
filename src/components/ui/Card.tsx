import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}

export default function Card({ children, className, gold }: CardProps) {
  return (
    <div
      className={cn("card p-5 mb-4", className)}
      style={
        gold
          ? {
              background: "linear-gradient(135deg,#eef2ff 0%,#ffffff 100%)",
              border: "1px solid rgba(30,58,138,0.14)",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  badge,
  badgeBlue,
}: {
  children: React.ReactNode;
  badge?: string;
  badgeBlue?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="font-semibold text-sm" style={{ color: "#0f172a" }}>{children}</h3>
      {badge && (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}
        >
          {badge}
        </span>
      )}
      {badgeBlue && (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(217,119,6,0.12)", color: "#b45309" }}
        >
          {badgeBlue}
        </span>
      )}
    </div>
  );
}
