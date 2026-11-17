import type { Metadata } from "next";
import Navbar from "@/components/2027/layout/Navbar";
import Footer from "@/components/2027/layout/Footer";
import { ServiceWorkerRegistration } from "@/app/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "ICAA 2027 Real-time meal statistics, certificate control, and audit logs.",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/pwa/apple-touch-icon.png",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16">
        {children}
      </main>

      <Footer />
      <ServiceWorkerRegistration />
    </div>
  );
}
