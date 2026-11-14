import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getActiveMealSlot } from "@/lib/flags";
import Scanner from "./Scanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meal Scanner",
  robots: { index: false, follow: false },
};

export default async function ScannerPage({
  params,
}: {
  params: Promise<{ scannerSlug: string }>;
}) {
  const { scannerSlug } = await params;
  const expectedSlug = process.env.SCANNER_SLUG;

  if (scannerSlug !== expectedSlug) {
    notFound();
  }

  const session = await getSession();
  if (!session) {
    redirect(`/${scannerSlug}/login`);
  }

  const initialSlot = await getActiveMealSlot();

  return (
    <Scanner
      volunteer={session.name}
      slug={scannerSlug}
      initialSlot={initialSlot}
    />
  );
}
