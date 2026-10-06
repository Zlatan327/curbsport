import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand-lockup${compact ? " brand-lockup--compact" : ""}`} href="/" aria-label="Inside Life home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-wordmark">
        <strong>INSIDE</strong>
        <small>LIFE / NG</small>
      </span>
    </Link>
  );
}
