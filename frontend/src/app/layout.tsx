import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { AICopilot } from "@/components/copilot/AICopilot";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outvier — Compare Australian University Programs",
  description:
    "Outvier helps you discover and compare university programs across Australia. Search by field, level, fees, and more to find your perfect course.",
  keywords: ["Australia", "University", "Programs", "Compare", "Adelaide", "Flinders", "CQUniversity", "Torrens"],
};

import { CompareBar } from "@/components/ui-custom/CompareBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <CompareBar />
        </Providers>
        <AICopilot />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
