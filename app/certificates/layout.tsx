import type { Metadata } from "next";
import Navbar from "@/components/2027/layout/Navbar";
import Footer from "@/components/2027/layout/Footer";

export const metadata: Metadata = {
  title: "Your Certificates",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink">
      <Navbar />
      {/* pt-24 on mobile, pt-32 on desktop ensures zero overlap with the fixed Navbar */}
      <main className="flex-1 pt-24 md:pt-32 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
