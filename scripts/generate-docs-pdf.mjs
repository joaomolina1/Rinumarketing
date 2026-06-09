import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "docs", "RINU_Marketing_AI_Documentacao.md");
const pdfPath = path.join(root, "docs", "RINU_Marketing_AI_Documentacao.pdf");

const BRAND = "#5cb7f3";
const TEXT = "#272b30";
const MUTED = "#54606b";

function stripMd(line) {
  return line
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1");
}

function writePdf() {
  const content = fs.readFileSync(mdPath, "utf-8");
  const lines = content.split("\n");

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 56, bottom: 64, left: 56, right: 56 },
    bufferPages: true,
    info: {
      Title: "RINU Marketing AI — Documentação",
      Author: "RINU",
      Subject: "Documentação da plataforma RINU Marketing AI",
    },
  });

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  function ensureSpace(h = 24) {
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  function hr() {
    ensureSpace(16);
    const yPos = doc.y + 8;
    doc
      .strokeColor("#e9ecef")
      .moveTo(doc.page.margins.left, yPos)
      .lineTo(doc.page.width - doc.page.margins.right, yPos)
      .stroke();
    doc.moveDown(0.8);
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line === "---") {
      hr();
      continue;
    }

    if (line.startsWith("# ")) {
      ensureSpace(40);
      doc.font("Helvetica-Bold").fontSize(22).fillColor(BRAND).text(stripMd(line.slice(2)), {
        width: pageWidth,
      });
      doc.moveDown(0.6);
      continue;
    }

    if (line.startsWith("## ")) {
      ensureSpace(32);
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT).text(stripMd(line.slice(3)), {
        width: pageWidth,
      });
      doc.moveDown(0.3);
      continue;
    }

    if (line.startsWith("### ")) {
      ensureSpace(24);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT).text(stripMd(line.slice(4)), {
        width: pageWidth,
      });
      doc.moveDown(0.2);
      continue;
    }

    if (line.startsWith("> ")) {
      ensureSpace(20);
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor(MUTED)
        .text(stripMd(line.slice(2)), { width: pageWidth, indent: 12 });
      doc.moveDown(0.3);
      continue;
    }

    if (line.startsWith("|")) {
      ensureSpace(14);
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      const text = cells.join("  |  ");
      if (text.length > 200) {
        doc.font("Helvetica").fontSize(8).fillColor(TEXT).text(text, { width: pageWidth });
      } else {
        doc.font("Helvetica").fontSize(9).fillColor(TEXT).text(text, { width: pageWidth });
      }
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      ensureSpace(14);
      doc.font("Helvetica").fontSize(10).fillColor(TEXT).text(stripMd(line), {
        width: pageWidth,
        indent: 10,
      });
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      ensureSpace(14);
      doc.font("Helvetica").fontSize(10).fillColor(TEXT).text(`• ${stripMd(line.slice(2))}`, {
        width: pageWidth,
        indent: 10,
      });
      continue;
    }

    if (line.startsWith("```")) continue;

    if (line.length === 0) {
      doc.moveDown(0.35);
      continue;
    }

    ensureSpace(14);
    doc.font("Helvetica").fontSize(10).fillColor(TEXT).text(stripMd(line), { width: pageWidth });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        `RINU Marketing AI — Documentação  ·  Página ${i - range.start + 1} de ${range.count}`,
        56,
        doc.page.height - 44,
        { align: "center", width: doc.page.width - 112, lineBreak: false }
      );
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(pdfPath));
    stream.on("error", reject);
  });
}

writePdf()
  .then((out) => console.log(`PDF gerado: ${out}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
