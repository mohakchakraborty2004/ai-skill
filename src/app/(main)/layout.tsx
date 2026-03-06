// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/sidebar";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Updated Metadata for your project
export const metadata: Metadata = {
  title: "Dev Insight | AI Skill Evaluator",
  description: "Cryptographically verify your technical claims using AI and GitHub data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white overflow-hidden`}
      >
        {/* Main Application Wrapper */}
        <div className="flex h-screen w-full">
          
          {/* Inject the Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}