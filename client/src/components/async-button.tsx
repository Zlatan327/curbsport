import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  busy?: boolean;
  children: ReactNode;
  variant?: "green" | "outline" | "dark";
}

export function AsyncButton({ busy = false, children, variant = "green", className, disabled, ...props }: Props) {
  return (
    <button {...props} disabled={busy || disabled} className={cn("button", `button--${variant}`, busy && "button--busy", className)}>
      {busy && <LoaderCircle className="spin" size={16} />}
      {children}
    </button>
  );
}
