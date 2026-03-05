import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import GlobalHeader from "@/components/GlobalHeader";
import { AuthProvider } from "@/context/AuthContext";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DebatHub",
  description: "Debate hub and resources for DebatHub partners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.className} font-sans bg-gray-50 text-acron-yoke-400 min-h-screen flex flex-col`}>
        <AuthProvider>
          <GlobalHeader />
          <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
