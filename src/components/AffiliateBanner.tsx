export default function AffiliateBanner() {
  return (
    <div
      className="mx-4 sm:mx-6 my-4 px-5 py-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      style={{
        background: "linear-gradient(135deg,rgba(251,191,36,0.12) 0%,rgba(15,23,42,0.8) 100%)",
        border: "1px solid rgba(251,191,36,0.2)",
      }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
          Play EuroMillions online
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          18+ | Please play responsibly | T&amp;Cs apply
        </p>
      </div>
      <a
        href="#"
        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-105 active:scale-95 glow-gold"
        style={{ background: "linear-gradient(135deg,#fbbf24,#d97706)", color: "#1c1917" }}
      >
        Buy tickets →
      </a>
    </div>
  );
}
