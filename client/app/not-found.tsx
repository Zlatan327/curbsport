import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

export default function NotFound() {
  return <main className="page-content" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
    <section className="panel" style={{ width: "min(100%, 520px)", padding: 25, textAlign: "center" }}>
      <span className="live-kicker-dot" style={{ display: "inline-block", marginBottom: 12 }} />
      <p className="eyebrow" style={{ display: "flex", justifyContent: "center" }}>404 · GROUND NOT FOUND</p>
      <h1 className="page-title" style={{ fontSize: 38 }}>No pin here.</h1>
      <p className="soft-copy">That ground or page is not on the radar. Head back to your campus feed and pick another spot.</p>
      <Link className="primary-button" href="/" style={{ marginTop: 15 }}><ArrowLeft size={14} /><MapPin size={14} />Back to radar</Link>
    </section>
  </main>;
}
