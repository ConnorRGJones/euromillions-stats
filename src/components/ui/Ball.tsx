import { cn } from "@/lib/utils";

interface BallProps {
  n: number;
  type?: "main" | "star";
  size?: "sm" | "md" | "lg";
  dim?: boolean;
  className?: string;
}

export default function Ball({ n, type = "main", size = "md", dim, className }: BallProps) {
  return (
    <span
      className={cn(
        "ball",
        type === "main" ? "ball-main" : "ball-star",
        size === "sm" ? "ball-sm" : size === "lg" ? "ball-lg" : "ball-md",
        dim && "opacity-40",
        className
      )}
    >
      {n}
    </span>
  );
}
