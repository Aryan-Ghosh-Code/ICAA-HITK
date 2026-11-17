import type { Metadata, Viewport } from "next";
import Navbar from "@/components/2027/layout/Navbar";
import Footer from "@/components/2027/layout/Footer";
import { ServiceWorkerRegistration } from "@/app/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Meal Scanner",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/pwa/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#151510",
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <Navbar />
      {/* pt-24 on mobile, pt-32 on desktop ensures zero overlap with the fixed Navbar */}
      <main className="flex-1 flex flex-col pt-24 md:pt-32 pb-16">{children}</main>
      <Footer />
      <ServiceWorkerRegistration />
    </div>
  );
}
