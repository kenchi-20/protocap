import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "ONE ID, ONE CONNECT · USA-JHS",
  description:
    "Title-defense prototype: one student ID for announcements, registration, dynamic QR attendance, and parent alerts.",
};

// Mobile Native: Proper viewport configuration for edge-to-edge display
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased min-h-dvh`}>
        <Providers>
          {/* pb reserves room for the fixed demo switcher bar so the last
              control on a page is never hidden underneath it. */}
          <div className="pb-44 sm:pb-28">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
