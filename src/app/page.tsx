"use client";

import { useState } from "react";
import Nav, { type TabId } from "@/components/Nav";
import AffiliateBanner from "@/components/AffiliateBanner";
import NewsletterBanner from "@/components/NewsletterBanner";

import Dashboard from "@/components/tabs/Dashboard";
import LuckyDip from "@/components/tabs/LuckyDip";
import NumberChecker from "@/components/tabs/NumberChecker";
import FrequencyTables from "@/components/tabs/FrequencyTables";
import Pairs from "@/components/tabs/Pairs";
import Outliers from "@/components/tabs/Outliers";
import Ranges from "@/components/tabs/Ranges";

export default function Home() {
  const [tab, setTab] = useState<TabId>("dashboard");

  return (
    <div className="flex flex-col min-h-dvh">
      <Nav active={tab} onChange={setTab} />

      <AffiliateBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-12">
        {tab === "dashboard" && <Dashboard />}
        {tab === "lucky-dip" && <LuckyDip />}
        {tab === "checker" && <NumberChecker />}
        {tab === "frequency" && <FrequencyTables />}
        {tab === "pairs" && <Pairs />}
        {tab === "outliers" && <Outliers />}
        {tab === "ranges" && <Ranges />}
      </main>

      <NewsletterBanner />

      <footer className="text-center py-5 text-xs border-t" style={{ color: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.08)" }}>
        EuroStats · Statistical analysis only · Not affiliated with The National Lottery or EuroMillions · 18+
      </footer>
    </div>
  );
}
