"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";

interface ToastState { title: string; detail?: string; kind?: "info" | "success"; id: number; }

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | null>(null);
  const showToast = useCallback((title: string, detail?: string, kind: ToastState["kind"] = "info") => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ title, detail, kind, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const ToastViewport = () => toast ? <div key={toast.id} className="toast-stack" aria-live="polite" aria-atomic="true"><div className="toast">{toast.kind === "success" ? <CheckCircle2 size={16} /> : <Info size={16} />}<div><strong>{toast.title}</strong>{toast.detail && <><br /><span>{toast.detail}</span></>}</div></div></div> : null;
  return { showToast, ToastViewport };
}
