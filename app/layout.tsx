import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { WaterDataProvider } from "@/context/WaterDataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FLOWS | Real-Time Flood Monitoring System",
  description: "Real-time flood monitoring system for tracking river water levels and emergency alerts in Denpasar, Bali. Stay informed and stay safe.",
  keywords: ["flood monitoring", "water level", "emergency alert", "disaster management", "Denpasar", "Bali"],
};

import { SettingsProvider } from "@/context/SettingsContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] min-h-screen`}
      >
        <LanguageProvider>
          <SettingsProvider>
            <AuthProvider>
              <WaterDataProvider>
                {children}
              </WaterDataProvider>
            </AuthProvider>
          </SettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
