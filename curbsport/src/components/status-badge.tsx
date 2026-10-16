import { cn } from "@/lib/cn";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toUpperCase();
  const label = key === "LIVE" ? "LIVE NOW" : key === "BUILDING" ? "BUILDING" : key === "DRY" ? "DRY GROUND" : key;
  return (
    <span className={cn("status-badge", `status-${key.toLowerCase()}`, className)}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
