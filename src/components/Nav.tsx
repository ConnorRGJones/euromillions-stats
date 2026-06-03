"use client";

import { useState } from "react";

const TABS = [
  { id: "dashboard",  label: "Dashboard" },
  { id: "lucky-dip",  label: "Lucky Dip" },
  { id: "checker",    label: "Number Checker" },
  { id: "frequency",  label: "Frequencies" },
  { id: "pairs",      label: "Pairs" },
  { id: "outliers",   label: "Outliers" },
  { id: "ranges",     label: "Box Plots" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface NavProps { active: TabId; onChange: (id: TabId) => void; }

export default function Nav({ active, onChange }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "#0f172a",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Gold accent line */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#f59e0b,#fcd34d,#d97706)", borderRadius: "0 0 2px 2px" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
              style={{
                background: "linear-gradient(145deg,#1d4ed8,#0f172a)",
                color: "#fbbf24",
                boxShadow: "0 2px 10px rgba(15,23,42,0.3)",
                letterSpacing: "-0.5px",
              }}
            >
              EM
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight" style={{ color: "#ffffff" }}>EuroStats</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={
                  active === tab.id
                    ? { color: "#fbbf24", background: "rgba(251,191,36,0.1)", fontWeight: 600 }
                    : { color: "rgba(255,255,255,0.55)" }
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <div className="w-5 h-0.5 bg-current mb-1.5" />
            <div className="w-5 h-0.5 bg-current mb-1.5" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "#0f172a" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { onChange(tab.id); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1"
              style={
                active === tab.id
                  ? { color: "#fbbf24", background: "rgba(251,191,36,0.1)", fontWeight: 600 }
                  : { color: "rgba(255,255,255,0.55)" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
