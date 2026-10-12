import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand-lockup${compact ? " brand-lockup--compact" : ""}`} href="/" aria-label="Curbsport home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-wordmark">
        <strong>CURB</strong>
        <small>SPORT / NG</small>
      </span>
    </Link>
  );
}
