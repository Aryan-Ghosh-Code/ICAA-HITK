// Generates QR codes from out/token_map.csv into out/qrs/<primary_pid>.png & .svg
// Also writes out/cards_for_designer.csv for badge printing
// Usage: npx tsx scripts/generate-qrs.ts

import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { parseCsv } from "../lib/master";

async function main() {
  const tokenMapPath = path.join("out", "token_map.csv");
  if (!fs.existsSync(tokenMapPath)) {
    console.error(
      `Token map not found: ${tokenMapPath}. Please run the seed script first.`,
    );
    process.exit(1);
  }

  const qrOutDir = path.join("out", "qrs");
  fs.mkdirSync(qrOutDir, { recursive: true });

  const [header, ...rows] = parseCsv(fs.readFileSync(tokenMapPath, "utf8"));
  const col = (name: string) => header.indexOf(name);

  const urlIdx = col("url");
  const pidIdx = col("primary_pid");
  const nameIdx = col("name");
  const rolesIdx = col("roles");

  for (const r of rows) {
    const url = r[urlIdx];
    const pid = r[pidIdx];

    // 1. High-resolution PNG for printing (width 1000px, error correction level Q)
    await QRCode.toFile(path.join(qrOutDir, `${pid}.png`), url, {
      errorCorrectionLevel: "Q",
      margin: 2,
      width: 1000,
    });

    // 2. Crisp SVG
    // const svgString = await QRCode.toString(url, {
    //   type: "svg",
    //   errorCorrectionLevel: "Q",
    //   margin: 2,
    // });
    // fs.writeFileSync(path.join(qrOutDir, `${pid}.svg`), svgString);
  }

  // 3. Clean spreadsheet for the card/badge designer (omits secret IDs and URLs)
  const cell = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const cards = ["primary_pid,name,roles,qr_file"];
  for (const r of rows) {
    cards.push(
      [r[pidIdx], r[nameIdx], r[rolesIdx]].map(cell).join(",") +
        `,${r[pidIdx]}.png`,
    );
  }
  const designerCsvPath = path.join("out", "cards_for_designer.csv");
  fs.writeFileSync(designerCsvPath, cards.join("\n") + "\n");

  console.log(`Generated ${rows.length} QR codes in ${qrOutDir}`);
  console.log(`Generated designer handoff sheet: ${designerCsvPath}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
