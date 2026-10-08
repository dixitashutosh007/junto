import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TopBarNav } from "@/components/TopBarNav";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Junto — Residential Co-commute & Community Hub",
  description: "Peer-to-peer co-commute matchmaking and community network for residential societies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 min-h-screen text-slate-900 selection:bg-emerald-100 selection:text-emerald-900`}>
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen bg-slate-50 md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-3xl shadow-2xl shadow-slate-300/60 border border-slate-200/70 flex flex-col justify-between overflow-hidden">
            <TopBarNav />
            <main className="flex-1 flex flex-col">{children}</main>
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
