// Creates "Screenshot needed" placeholder images for draft walkthroughs.
//
// Placeholders are deliberately NOT drawings of a device screen. Each one is a
// plain grey card that names the step and marks the approximate highlight area
// with a dashed outline, so a reviewer can see where the highlight was guessed
// and the player's overlay alignment can be checked against it.
//
// Usage: npm run library:placeholders [-- --force]
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { readLibrary } from "../src/lib/library";
import { PLACEHOLDER_IMAGE_PATTERN, type Device, type Highlight } from "../src/lib/walkthrough-format";

const SIZES: Record<Device, { w: number; h: number; wrap: number }> = {
  // Portrait phone and 16:9 laptop proportions.
  iphone: { w: 590, h: 1278, wrap: 26 },
  windows: { w: 1280, h: 720, wrap: 60 },
};

const force = process.argv.includes("--force");

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function highlightSvg(h: Highlight | null, w: number, hgt: number): string {
  if (!h) return "";
  const style = `fill="none" stroke="#6b7280" stroke-width="4" stroke-dasharray="14 10"`;
  const label = (x: number, y: number) =>
    `<text x="${x}" y="${y}" font-size="20" fill="#4b5563" font-family="Arial, sans-serif">approx. highlight</text>`;
  if (h.type === "box") {
    const x = (h.x / 100) * w;
    const y = (h.y / 100) * hgt;
    const bw = (h.w / 100) * w;
    const bh = (h.h / 100) * hgt;
    const labelY = y > 30 ? y - 8 : y + bh + 24;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" ${style}/>${label(x, labelY)}`;
  }
  const cx = (h.x / 100) * w;
  const cy = (h.y / 100) * hgt;
  return `<circle cx="${cx}" cy="${cy}" r="18" ${style}/>${label(cx + 26, cy + 7)}`;
}

function placeholderSvg(device: Device, title: string, stepNo: number, total: number, text: string, h: Highlight | null) {
  const { w, h: hgt, wrap: max } = SIZES[device];
  const lines = wrap(text, max);
  const lineHeight = 40;
  // Keep the text away from the highlight so neither hides the other.
  const highlightCenterY = h ? h.y + (h.type === "box" ? h.h / 2 : 0) : null;
  const textCenter = highlightCenterY === null ? 0.5 : highlightCenterY >= 50 ? 0.3 : 0.7;
  const startY = hgt * textCenter - (lines.length * lineHeight) / 2 + 40;
  const body = lines
    .map((l, i) => `<text x="${w / 2}" y="${startY + i * lineHeight}" text-anchor="middle" font-size="30" fill="#1f2937" font-family="Arial, sans-serif">${escapeXml(l)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">
  <rect width="100%" height="100%" fill="#e5e7eb"/>
  <rect x="12" y="12" width="${w - 24}" height="${hgt - 24}" fill="none" stroke="#9ca3af" stroke-width="4" stroke-dasharray="20 12"/>
  <text x="${w / 2}" y="${startY - 110}" text-anchor="middle" font-size="40" font-weight="bold" fill="#111827" font-family="Arial, sans-serif">SCREENSHOT NEEDED</text>
  <text x="${w / 2}" y="${startY - 62}" text-anchor="middle" font-size="24" fill="#374151" font-family="Arial, sans-serif">${escapeXml(`${device === "iphone" ? "iPhone" : "Windows"} · Step ${stepNo} of ${total}`)}</text>
  ${body}
  <text x="${w / 2}" y="${hgt - 40}" text-anchor="middle" font-size="20" fill="#4b5563" font-family="Arial, sans-serif">${escapeXml(title)}</text>
  ${highlightSvg(h, w, hgt)}
</svg>`;
}

async function main() {
  const libraryRoot = path.resolve("library");
  // Missing placeholder files are expected here; creating them is the point.
  const { entries, problems } = readLibrary(libraryRoot, { checkImages: false });
  if (problems.length) {
    for (const p of problems) console.error(`✗ ${path.relative(libraryRoot, p.dir)}: ${p.message}`);
    process.exit(1);
  }

  let made = 0;
  for (const { dir, walkthrough: wt } of entries) {
    for (const step of wt.steps) {
      if (!PLACEHOLDER_IMAGE_PATTERN.test(step.image)) continue;
      const file = path.join(dir, step.image);
      if (existsSync(file) && !force) continue;
      const svg = placeholderSvg(wt.device, wt.title, step.order, wt.steps.length, step.text, step.highlight);
      await sharp(Buffer.from(svg)).png().toFile(file);
      made++;
      console.log(`  made ${path.relative(libraryRoot, file)}`);
    }
  }
  console.log(`Done. ${made} placeholder image(s) created.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
