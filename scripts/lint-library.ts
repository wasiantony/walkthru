// Checks walkthrough files against the format and the step-writing rules:
//   - one action per step (no "then")
//   - under 20 words
//   - no unexplained jargon
//   - starts with an action word (warning only)
//
// Usage: npm run library:lint
import path from "node:path";
import { readLibrary } from "../src/lib/library";

const MAX_WORDS = 20;

// Words staff should never see without explanation. Matched as whole words,
// case-insensitive.
const BANNED_JARGON = [
  "UI",
  "GUI",
  "toggle",
  "context menu",
  "hamburger menu",
  "kebab menu",
  "dropdown",
  "drop-down",
  "checkbox",
  "radio button",
  "widget",
  "cursor",
  "taskbar",
  "system tray",
  "navigate",
  "interface",
  "right-click",
  "double-tap",
  "long-press",
  "clipboard",
  "URL",
  "OS",
];

// Common action words a step may start with. Anything else is a warning.
const ACTION_WORDS = new Set(
  "tap click press scroll type drag swipe hold let look open find choose pick turn wait say speak check move slide put go enter touch write read sign take point plug unplug".split(" "),
);

const jargonPatterns = BANNED_JARGON.map((term) => ({
  term,
  re: new RegExp(`(^|[^a-z0-9])${term.replace(/[-]/g, "[- ]?").replace(/ /g, "\\s+")}($|[^a-z0-9])`, "i"),
}));

function main() {
  const libraryRoot = path.resolve("library");
  const { entries, problems } = readLibrary(libraryRoot);
  let errors = 0;
  let warnings = 0;

  for (const p of problems) {
    console.error(`✗ ${path.relative(libraryRoot, p.dir)}: ${p.message}`);
    errors++;
  }

  for (const { dir, walkthrough } of entries) {
    const where = path.relative(libraryRoot, dir);
    for (const step of walkthrough.steps) {
      const at = `${where} step ${step.order}`;
      const words = step.text.split(/\s+/).filter(Boolean);

      if (words.length >= MAX_WORDS) {
        console.error(`✗ ${at}: ${words.length} words (must be under ${MAX_WORDS})`);
        errors++;
      }
      if (/\bthen\b/i.test(step.text)) {
        console.error(`✗ ${at}: uses "then" — split it into one action per step`);
        errors++;
      }
      for (const { term, re } of jargonPatterns) {
        if (re.test(step.text)) {
          console.error(`✗ ${at}: uses jargon "${term}"`);
          errors++;
        }
      }
      const first = words[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
      if (!ACTION_WORDS.has(first)) {
        console.warn(`! ${at}: starts with "${words[0]}" — steps should start with an action word like Tap or Click`);
        warnings++;
      }
      if (/\bicons?\b/i.test(step.text) && !/\bpicture\b/i.test(step.text)) {
        console.warn(`! ${at}: says "icon" — describe it as a picture the first time`);
        warnings++;
      }
    }
  }

  console.log(`\n${entries.length} walkthrough(s) checked: ${errors} error(s), ${warnings} warning(s).`);
  if (errors) process.exit(1);
}

main();
