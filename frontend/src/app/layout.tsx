import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "@/components/common/Toast";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StreamStudio - Professional Live Streaming",
  description: "Browser-based live streaming studio for professional broadcasts. Multi-participant video, screen sharing, overlays, and multi-platform streaming.",
  keywords: ["live streaming", "broadcast", "webrtc", "video conferencing", "streaming studio"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

