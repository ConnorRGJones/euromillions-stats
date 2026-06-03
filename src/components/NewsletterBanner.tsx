export default function NewsletterBanner() {
  return (
    <div className="card mx-4 sm:mx-6 my-4 px-5 py-6 text-center">
      <p className="text-sm font-semibold mb-1" style={{ color: "#0f172a" }}>
        Get draw results &amp; stats in your inbox
      </p>
      <p className="text-xs mb-4" style={{ color: "#64748b" }}>
        Weekly digest — no spam, unsubscribe any time
      </p>
      <div
        className="rounded-lg h-12 flex items-center justify-center text-xs"
        style={{ background: "#f1f5f9", border: "1px dashed #cbd5e1", color: "#94a3b8" }}
      >
        Beehiiv embed will go here
      </div>
    </div>
  );
}
