import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg className={`brand-mark ${className}`} viewBox="0 0 96 96" role="img" aria-label="Curbsport mark">
      <rect width="96" height="96" rx="24" fill="#111311" />
      <path d="M28 67V29h38M28 48h27" fill="none" stroke="#00ff66" strokeWidth="7" strokeLinecap="square" />
      <circle cx="59" cy="49" r="13" fill="none" stroke="#00ff66" strokeWidth="2" opacity=".75" />
      <circle cx="59" cy="49" r="3.5" fill="#00ff66" />
      <path d="M59 33v7M59 58v7M43 49h7M68 49h7" stroke="#00ff66" strokeWidth="2" opacity=".6" />
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
