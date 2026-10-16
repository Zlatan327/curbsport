import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg className={`brand-mark ${className}`} viewBox="0 0 64 64" role="img" aria-label="Curbsport mark">
      <rect width="64" height="64" rx="14" fill="#111311" />
      <path d="M10 17h44v7H10zm0 12h30v7H10zm0 12h44v7H10z" fill="#00ff66" />
      <path d="m42 29 12 7-12 7z" fill="#ffd700" />
    </svg>
  );
}

export function BrandLockup() {
  return (
    <Link href="/" className="brand-lockup" aria-label="Curbsport home">
      <BrandMark />
      <span className="wordmark">
        <span className="wordmark-main">CURB<span>SPORT</span></span>
        <span className="wordmark-sub">/ NG · GROUND RADAR</span>
      </span>
    </Link>
  );
}
