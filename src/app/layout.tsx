import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EuroMillions Stats — Smart Lucky Dip & Draw Analysis",
  description:
    "Statistical analysis of 428 EuroMillions draws. Frequency tables, co-occurrence pairs, outlier analysis, and a smart lucky dip generator.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
