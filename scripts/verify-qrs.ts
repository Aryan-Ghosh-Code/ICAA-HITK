// Verifies all generated QR PNGs in out/qrs against out/token_map.csv
// Usage: npx tsx scripts/verify-qrs.ts

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import jsQR from "jsqr";
import { parseCsv } from "../lib/master";

async function decodeQr(filePath: string): Promise<string | null> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const clamped = new Uint8ClampedArray(data);
  const code = jsQR(clamped, info.width, info.height);
  return code ? code.data : null;
}

async function main() {
  const tokenMapPath = path.join("out", "token_map.csv");
  if (!fs.existsSync(tokenMapPath)) {
    console.error(`Token map not found: ${tokenMapPath}`);
    process.exit(1);
  }

  const [header, ...rows] = parseCsv(fs.readFileSync(tokenMapPath, "utf8"));
  const col = (name: string) => header.indexOf(name);
  const urlIdx = col("url");
  const pidIdx = col("primary_pid");

  const qrOutDir = path.join("out", "qrs");
  if (!fs.existsSync(qrOutDir)) {
    console.error(`QR directory not found: ${qrOutDir}`);
    process.exit(1);
  }

  let failed = 0;
  let passed = 0;

  for (const r of rows) {
    const pid = r[pidIdx];
    const expectedUrl = r[urlIdx];
    const qrFile = path.join(qrOutDir, `${pid}.png`);

    if (!fs.existsSync(qrFile)) {
      console.error(`FAIL: Missing QR file for ${pid} at ${qrFile}`);
      failed++;
      continue;
    }

    try {
      const decoded = await decodeQr(qrFile);
      if (decoded === expectedUrl) {
        console.log(`PASS: ${pid} -> ${decoded}`);
        passed++;
      } else {
        console.error(
          `FAIL: ${pid} decoded "${decoded}" does not match "${expectedUrl}"`,
        );
        failed++;
      }
    } catch (e: any) {
      console.error(`FAIL: ${pid} decode error: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nVerification Summary: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
