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
  title: "SocietyApps — Ride Share",
  description: "Community-driven commute connection for residential societies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-100 min-h-screen text-zinc-900`}>
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col justify-between">
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
