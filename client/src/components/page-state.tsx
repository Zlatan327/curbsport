import { LoaderCircle, SearchX } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Checking the ground…" }: { label?: string }) {
  return <div className="page-state"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty-state"><SearchX size={23} /><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}
