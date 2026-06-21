import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Martian_Mono,
  Sora,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

// Display face — the big IATA codes & wordmark. A grotesque with real
// personality, deliberately not Inter/Space Grotesque.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-display",
  display: "swap",
});

// Body / UI text.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

// Printed ticket data — boxy, dot-matrix feel for codes, dates, gates.
const ticket = Martian_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ticket",
  display: "swap",
});

// Retained for the /map route (stats over the dark globe).
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "iFlight — Your boarding-pass travel log",
  description:
    "Personal flight tracking app — log flights, view your dashboard, and visualize your travel history as a wall of boarding passes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sora.variable} ${ticket.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
