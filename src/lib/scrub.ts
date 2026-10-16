// Removes personal details from a staff question before it is searched or
// stored. Staff may type client details ("call Maria Lopez back at 555-0142"),
// and the brief says those must never be kept.
//
// This is a best-effort filter, not a guarantee: it catches email addresses,
// phone and other long numbers, street addresses, and capitalized names. A
// name typed in lowercase ("my client john") can slip through.
import catalog from "../../library/catalog.json";

// Words that are fine to keep even when capitalized mid-sentence: everything
// in the walkthrough catalog plus common product names and calendar words.
const KEEP = new Set<string>();
for (const w of catalog.walkthroughs) {
  for (const text of [w.title, w.summary, w.category, ...w.synonyms]) {
    for (const word of text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? []) KEEP.add(word);
  }
}
for (const word of (
  "i iphone ipad windows outlook teams zoom word excel powerpoint pdf wifi wi-fi bluetooth onedrive sharepoint " +
  "microsoft google apple airpods edge chrome safari firefox gmail face id qr vpn ios android samsung adobe " +
  "monday tuesday wednesday thursday friday saturday sunday january february march april may june july august " +
  "september october november december ok okay please thanks hi hello help the a an my how what why when where can " +
  "settings app apps start menu button home photos mail messages maps calendar notes files store clock contacts " +
  "calculator weather music control centre center display brightness general accessibility search wallpaper " +
  "snipping tool paint notepad explorer recycle bin task manager facetime whatsapp messenger"
).split(" ")) {
  KEEP.add(word);
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// 7+ digits, allowing spaces, dots, dashes, brackets and a leading +.
const PHONE = /\+?\(?\d[\d\s().-]{5,}\d/g;
const LONG_NUMBER = /\b\d{5,}\b/g;
const ADDRESS =
  /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,3}(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|way|court|ct|crescent|cres|place|pl)\b\.?/gi;
const TITLE_NAME = /\b(?:mr|mrs|ms|miss|dr)\.?\s+[A-Za-z][a-z'-]+/gi;

export function scrubPersonalInfo(input: string): string {
  let text = input.replace(/\s+/g, " ").trim();
  text = text.replace(EMAIL, "[email]");
  text = text.replace(ADDRESS, "[address]");
  text = text.replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 7 ? "[number]" : m));
  text = text.replace(LONG_NUMBER, "[number]");
  text = text.replace(TITLE_NAME, "[name]");

  // Capitalized words that aren't known words and don't start a sentence.
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    const match = words[i].match(/^([("']*)([A-Z][a-z'-]+)([.,!?;:)"']*)$/);
    if (!match) continue;
    const startsSentence = i === 0 || /[.!?]$/.test(words[i - 1]);
    if (startsSentence) continue;
    if (KEEP.has(match[2].toLowerCase())) continue;
    words[i] = `${match[1]}[name]${match[3]}`;
  }
  // Collapse "[name] [name]" into one.
  return words.join(" ").replace(/\[name\](?:\s+\[name\])+/g, "[name]");
}
