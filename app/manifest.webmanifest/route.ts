import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const slug = process.env.SCANNER_SLUG || "vol-k7x2q9";

  const manifest = {
    name: "ICAA 2027 Operations",
    short_name: "ICAA Ops",
    description: "ICAA 2027 Operations Portal - Admin Dashboard and Meal Redemption Scanner",
    start_url: `/${slug}`,
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F5F0E8",
    theme_color: "#173D28",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Meal Scanner",
        short_name: "Scanner",
        description: "Open the volunteer meal scanner",
        url: `/${slug}`,
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Admin Panel",
        short_name: "Admin",
        description: "Open the conference admin dashboard",
        url: "/admin",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
