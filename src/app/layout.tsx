import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { InboundProvider } from "@/context/inbound-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InboundOS — Warehouse Scanner",
  description:
    "Aplikasi scanner gudang untuk proses inbound barang FMCG. Scan barcode, catat expiry date, dan tracking Purchase Order secara real-time.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InboundOS",
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <InboundProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </InboundProvider>
      </body>
    </html>
  );
}
