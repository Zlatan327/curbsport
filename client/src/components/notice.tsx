import type { ReactNode } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function Notice({ tone = "info", children, className }: { tone?: "info" | "warning" | "success"; children: ReactNode; className?: string }) {
  const Icon = tone === "warning" ? AlertTriangle : tone === "success" ? Check : Info;
  return <div className={cn("notice", `notice--${tone}`, className)}><Icon size={17} /><div>{children}</div></div>;
}
