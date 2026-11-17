// Builds out/contact_sheet.pdf for quick test printing on A4 paper
// Usage: npx tsx scripts/make-contact-sheet.ts

import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { parseCsv } from "../lib/master";

const CM = 28.3465;

async function main() {
  const tokenMapPath = path.join("out", "token_map.csv");
  if (!fs.existsSync(tokenMapPath)) {
    console.error(`Token map not found: ${tokenMapPath}`);
    process.exit(1);
  }

  const qrOutDir = path.join("out", "qrs");
  const [header, ...rows] = parseCsv(fs.readFileSync(tokenMapPath, "utf8"));
  const col = (name: string) => header.indexOf(name);
  const pidIdx = col("primary_pid");
  const nameIdx = col("name");

  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const cols = 3;
  const rowsPerPage = 4;
  const perPage = cols * rowsPerPage;

  const qrSize = 3.5 * CM;
  const cellWidth = pageWidth / cols;
  const cellHeight = (pageHeight - 60) / rowsPerPage;

  for (let i = 0; i < rows.length; i += perPage) {
    const pageRows = rows.slice(i, i + perPage);
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    page.drawText(
      `ICAA 2027 QR Contact Sheet — Page ${Math.floor(i / perPage) + 1}`,
      {
        x: 30,
        y: pageHeight - 30,
        size: 10,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      },
    );

    for (let j = 0; j < pageRows.length; j++) {
      const r = pageRows[j];
      const pid = r[pidIdx];
      const name = r[nameIdx];
      const pngPath = path.join(qrOutDir, `${pid}.png`);

      if (!fs.existsSync(pngPath)) continue;

      const colIdx = j % cols;
      const rowIdx = Math.floor(j / cols);

      const cellX = colIdx * cellWidth;
      const cellY = pageHeight - 50 - (rowIdx + 1) * cellHeight;

      const qrPngBytes = fs.readFileSync(pngPath);
      const embeddedImage = await pdfDoc.embedPng(qrPngBytes);

      const imgX = cellX + (cellWidth - qrSize) / 2;
      const imgY = cellY + 40;

      page.drawImage(embeddedImage, {
        x: imgX,
        y: imgY,
        width: qrSize,
        height: qrSize,
      });

      page.drawText(name.length > 28 ? name.slice(0, 26) + "…" : name, {
        x: cellX + 15,
        y: cellY + 22,
        size: 9,
        font: helveticaBold,
        maxWidth: cellWidth - 30,
      });

      page.drawText(pid, {
        x: cellX + 15,
        y: cellY + 10,
        size: 8,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  const outPdfPath = path.join("out", "contact_sheet.pdf");
  fs.writeFileSync(outPdfPath, await pdfDoc.save());
  console.log(`Generated contact sheet: ${outPdfPath}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
