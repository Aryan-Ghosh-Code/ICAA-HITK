import type { Metadata } from "next";
import { DM_Serif_Display, Spline_Sans_Mono, Roboto_Mono } from "next/font/google";
import "@/styles/2027/globals.css";
import { ACTIVE_YEAR, SITE_URL } from "@/lib/config";
import { images } from "@/constants/2027/cloudinary_images";

const DESCRIPTION = `The International Conference on Applied Algorithms (ICAA) brings together researchers, practitioners, and students interested in all aspects of algorithm design and analysis.`;

const GOOGLE_VERIFICATION_TOKEN = process.env.GOOGLE_SITE_VERIFICATION_TOKEN;

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

const spline = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-spline",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL || "https://icaa.co.in"),
  title: {
    default: `ICAA ${ACTIVE_YEAR}`,
    template: `ICAA ${ACTIVE_YEAR} %s`,
  },
  description: DESCRIPTION,
  keywords: [
    "ICAA",
    "icaa",
    "icaaa",
    "Icaa",
    `Icaa ${ACTIVE_YEAR}`,
    `icaa ${ACTIVE_YEAR}`,
    `ICAA ${ACTIVE_YEAR}`,
    "International Conference on Applied Algorithms",
    "algorithms",
    "computer science conference",
    "Heritage Institute of Technology",
    "Kolkata",
    "India",
  ],
  authors: [{ name: "Heritage Institute of Technology, Kolkata" }],
  creator: "Heritage Institute of Technology, Kolkata",
  publisher: "Heritage Institute of Technology, Kolkata",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `International Conference on Applied Algorithms (ICAA) ${ACTIVE_YEAR}`,
    description: DESCRIPTION,
    url: SITE_URL || "https://icaa.co.in",
    siteName: `ICAA ${ACTIVE_YEAR}`,
    images: [{ url: images.hero, width: 1200, height: 630, alt: `ICAA ${ACTIVE_YEAR} hero image` }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `International Conference on Applied Algorithms (ICAA) ${ACTIVE_YEAR}`,
    description: DESCRIPTION,
    images: [images.hero],
  },
  verification: {
    google: GOOGLE_VERIFICATION_TOKEN,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${dmSerif.variable} ${spline.variable} ${robotoMono.variable} font-sans min-h-full flex flex-col bg-paper text-ink`}>
        {children}
      </body>
    </html>
  );
}
