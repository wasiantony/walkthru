// Static SVG artwork for the drawing kit. These are fixed strings written
// here (never data from walkthrough files), so they can be inserted as markup.
// The pictures are simplified, generic shapes rather than copies of real icons.

function gear(cx: number, cy: number, r: number, teeth: number, fill: string, hole: string) {
  let s = "";
  for (let i = 0; i < teeth; i++) {
    s += `<rect x="${cx - r * 0.2}" y="${cy - r * 1.32}" width="${r * 0.4}" height="${r * 0.5}" rx="${r * 0.08}" fill="${fill}" transform="rotate(${(i * 360) / teeth} ${cx} ${cy})"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="${hole}"/>`;
}

// ---------- iPhone ----------

export const PHONE_STATUS_ICONS =
  '<svg width="74" height="14" viewBox="0 0 74 14" fill="currentColor"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/><path d="M26 5a9 9 0 0 1 12 0l-1.5 1.6a7 7 0 0 0-9 0zM29 8.2a5 5 0 0 1 6 0L32 11.4z"/><rect x="46" y="1" width="24" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><rect x="48" y="3" width="17" height="8" rx="2"/><rect x="71" y="5" width="2" height="4" rx="1" opacity=".5"/></svg>';

export const PHONE_GLYPH_ART: Record<string, string> = {
  plane: '<path d="M10 2l2 6 6 3v2l-6-1-1 4 2 2v1l-3-1-3 1v-1l2-2-1-4-6 1v-2l6-3z" fill="#fff"/>',
  wifi: '<path d="M3 8a10 10 0 0 1 14 0M6 11a6 6 0 0 1 8 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14.5" r="1.8" fill="#fff"/>',
  bars: '<rect x="3" y="12" width="3" height="5" rx="1" fill="#fff"/><rect x="8.5" y="8" width="3" height="9" rx="1" fill="#fff"/><rect x="14" y="4" width="3" height="13" rx="1" fill="#fff"/>',
  bell: '<path d="M10 3a5 5 0 0 0-5 5v4l-2 2h14l-2-2V8a5 5 0 0 0-5-5z" fill="#fff"/><circle cx="10" cy="16.5" r="1.8" fill="#fff"/>',
  moon: '<path d="M13 3a7 7 0 1 0 4 11 6 6 0 0 1-4-11z" fill="#fff"/>',
  person: '<circle cx="10" cy="5" r="2.5" fill="#fff"/><path d="M4 8h12M10 8v5l-3 5M10 13l3 5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  sun:
    '<circle cx="10" cy="10" r="3.6" fill="#fff"/>' +
    [0, 45, 90, 135, 180, 225, 270, 315]
      .map((a) => `<line x1="10" y1="2.2" x2="10" y2="4.4" stroke="#fff" stroke-width="2" stroke-linecap="round" transform="rotate(${a} 10 10)"/>`)
      .join(""),
  gear: gear(10, 10, 5.5, 8, "#fff", "#8e8e93"),
  dot: '<rect x="5" y="5" width="10" height="10" rx="3" fill="#fff" opacity=".9"/>',
};

export type PhoneApp = { id?: string; label: string; art: string };

export const PHONE_HOME_APPS: PhoneApp[] = [
  { label: "Calendar", art: '<rect width="64" height="64" fill="#fff"/><text x="32" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="#f2453d" font-family="Arial">THU</text><text x="32" y="49" text-anchor="middle" font-size="30" fill="#111" font-family="Arial">15</text>' },
  { label: "Photos", art: '<rect width="64" height="64" fill="#fff"/><g opacity=".85"><circle cx="32" cy="20" r="9" fill="#f9b233"/><circle cx="43" cy="27" r="9" fill="#9bd23c"/><circle cx="41" cy="40" r="9" fill="#2fb6e8"/><circle cx="29" cy="44" r="9" fill="#5b6ee8"/><circle cx="20" cy="35" r="9" fill="#d649a7"/><circle cx="22" cy="23" r="9" fill="#f5603d"/></g>' },
  { label: "Camera", art: '<rect width="64" height="64" fill="#c4c5c9"/><rect x="12" y="22" width="40" height="26" rx="5" fill="#2b2c30"/><rect x="24" y="17" width="16" height="7" rx="2" fill="#2b2c30"/><circle cx="32" cy="35" r="9" fill="#5c6068"/><circle cx="32" cy="35" r="5" fill="#1a1b1e"/>' },
  { label: "Reminders", art: '<rect width="64" height="64" fill="#fff"/><circle cx="17" cy="20" r="4" fill="#ff9f0a"/><circle cx="17" cy="32" r="4" fill="#0a84ff"/><circle cx="17" cy="44" r="4" fill="#ff453a"/><rect x="26" y="19" width="26" height="2.5" rx="1" fill="#c7c7cc"/><rect x="26" y="31" width="26" height="2.5" rx="1" fill="#c7c7cc"/><rect x="26" y="43" width="26" height="2.5" rx="1" fill="#c7c7cc"/>' },
  { label: "Clock", art: '<rect width="64" height="64" fill="#111"/><circle cx="32" cy="32" r="24" fill="#fff"/><line x1="32" y1="32" x2="32" y2="15" stroke="#111" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="32" x2="43" y2="38" stroke="#111" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="2.5" fill="#ff9f0a"/>' },
  { label: "Maps", art: '<rect width="64" height="64" fill="#dfeccf"/><rect x="-10" y="38" width="90" height="9" fill="#f6d36b" transform="rotate(-30 32 32)"/><rect x="28" y="-10" width="8" height="90" fill="#fff" transform="rotate(20 32 32)"/><circle cx="40" cy="22" r="6" fill="#0a84ff" stroke="#fff" stroke-width="3"/>' },
  { label: "Weather", art: '<rect width="64" height="64" fill="#3f8ae6"/><circle cx="24" cy="24" r="10" fill="#ffd60a"/><ellipse cx="38" cy="40" rx="16" ry="9" fill="#fff"/><circle cx="31" cy="35" r="8" fill="#fff"/>' },
  { label: "Notes", art: '<rect width="64" height="64" fill="#fff"/><rect width="64" height="16" fill="#ffd34d"/><rect x="10" y="26" width="44" height="2.5" fill="#d1d1d6"/><rect x="10" y="36" width="44" height="2.5" fill="#d1d1d6"/><rect x="10" y="46" width="30" height="2.5" fill="#d1d1d6"/>' },
  { id: "app-settings", label: "Settings", art: '<rect width="64" height="64" fill="#a9adb5"/>' + gear(32, 32, 17, 12, "#4d525b", "#b3b7bf") },
  { label: "Files", art: '<rect width="64" height="64" fill="#1e7cf2"/><path d="M14 22h14l4 5h18v19H14z" fill="#fff"/>' },
  { label: "Contacts", art: '<rect width="64" height="64" fill="#e4e4e8"/><circle cx="32" cy="25" r="9" fill="#8e8e93"/><path d="M15 50c2-10 9-14 17-14s15 4 17 14z" fill="#8e8e93"/>' },
  { label: "Calculator", art: '<rect width="64" height="64" fill="#1c1c1e"/>' + [19, 32, 45].flatMap((y) => [19, 32, 45].map((x) => `<circle cx="${x}" cy="${y}" r="6" fill="${x === 45 ? "#ff9f0a" : y === 19 ? "#a5a5aa" : "#505055"}"/>`)).join("") },
];

export const PHONE_DOCK_APPS: PhoneApp[] = [
  { label: "Phone", art: '<rect width="64" height="64" fill="#34c759"/><path d="M21 15c2-1 4 0 5 2l3 6c1 2 0 4-1 5l-3 2c2 5 6 9 11 11l2-3c1-1 3-2 5-1l6 3c2 1 3 3 2 5l-2 4c-2 3-6 4-10 2-9-4-17-12-21-21-2-4-1-8 2-10z" fill="#fff"/>' },
  { label: "Messages", art: '<rect width="64" height="64" fill="#34c759"/><ellipse cx="32" cy="30" rx="19" ry="15" fill="#fff"/><path d="M17 44l3-9 8 6z" fill="#fff"/>' },
  { label: "Mail", art: '<rect width="64" height="64" fill="#1e7cf2"/><rect x="12" y="19" width="40" height="27" rx="3" fill="#fff"/><path d="M13 21l19 14 19-14" fill="none" stroke="#1e7cf2" stroke-width="3"/>' },
  { label: "Music", art: '<rect width="64" height="64" fill="#fa2d48"/><path d="M28 16l16-4v28" fill="none" stroke="#fff" stroke-width="4"/><path d="M28 16v28" stroke="#fff" stroke-width="4"/><circle cx="24" cy="45" r="6" fill="#fff"/><circle cx="40" cy="41" r="6" fill="#fff"/>' },
];

export const PHONE_CHECK = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="#fff" stroke-width="2"/></svg>';
export const PHONE_SEARCH = '<svg width="18" height="18" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="#8a8a8e" stroke-width="2"/><line x1="13" y1="13" x2="18" y2="18" stroke="#8a8a8e" stroke-width="2" stroke-linecap="round"/></svg>';

// ---------- Windows ----------

export const WIN_START =
  '<svg width="24" height="24" viewBox="0 0 24 24"><defs><linearGradient id="wst" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2aa8f2"/><stop offset="1" stop-color="#0a5fd1"/></linearGradient></defs><rect x="1" y="1" width="10.5" height="10.5" rx="1" fill="url(#wst)"/><rect x="12.5" y="1" width="10.5" height="10.5" rx="1" fill="url(#wst)"/><rect x="1" y="12.5" width="10.5" height="10.5" rx="1" fill="url(#wst)"/><rect x="12.5" y="12.5" width="10.5" height="10.5" rx="1" fill="url(#wst)"/></svg>';

const tile = (bg: string, inner: string, size = 32) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${bg}"/>${inner}</svg>`;

export const WIN_ICONS: Record<string, (size?: number) => string> = {
  search: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="none" stroke="#333" stroke-width="2"/><line x1="15" y1="15" x2="21" y2="21" stroke="#333" stroke-width="2" stroke-linecap="round"/></svg>`,
  folder: (s = 32) => tile("#f8c14a", '<path d="M6 10h8l2 2h10v12H6z" fill="#fff" opacity=".85"/>', s),
  browser: (s = 32) => tile("#1f9ed8", '<circle cx="16" cy="16" r="9" fill="none" stroke="#fff" stroke-width="3"/><path d="M10 18c3-6 12-6 13 1" fill="none" stroke="#7ee0b8" stroke-width="3"/>', s),
  mail: (s = 32) => tile("#0f6cbd", '<rect x="6" y="9" width="20" height="14" rx="2" fill="#fff"/><path d="M7 10l9 7 9-7" fill="none" stroke="#0f6cbd" stroke-width="2"/>', s),
  word: (s = 32) => tile("#185abd", '<text x="16" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Arial">W</text>', s),
  excel: (s = 32) => tile("#107c41", '<text x="16" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Arial">X</text>', s),
  teams: (s = 32) => tile("#5b5fc7", '<text x="16" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Arial">T</text>', s),
  settings: (s = 32) => tile("#6b7280", gear(16, 16, 6.5, 8, "#fff", "#6b7280"), s),
  store: (s = 32) => tile("#2f6fde", '<rect x="8" y="12" width="16" height="12" rx="2" fill="#fff"/><path d="M12 12v-2a4 4 0 0 1 8 0v2" fill="none" stroke="#fff" stroke-width="2"/>', s),
  photos: (s = 32) => tile("#e8f1ff", '<circle cx="12" cy="13" r="3" fill="#f9b233"/><path d="M5 25l8-8 5 5 4-3 5 6z" fill="#2f6fde"/>', s),
  calculator: (s = 32) => tile("#3b3f46", '<rect x="9" y="7" width="14" height="5" rx="1" fill="#cfd5dd"/><g fill="#cfd5dd"><rect x="9" y="15" width="4" height="4" rx="1"/><rect x="14" y="15" width="4" height="4" rx="1"/><rect x="19" y="15" width="4" height="4" rx="1"/><rect x="9" y="20" width="4" height="4" rx="1"/><rect x="14" y="20" width="4" height="4" rx="1"/><rect x="19" y="20" width="4" height="4" rx="1"/></g>', s),
  notepad: (s = 32) => tile("#5aa6e8", '<rect x="9" y="7" width="14" height="18" rx="2" fill="#fff"/><path d="M12 12h8M12 16h8M12 20h5" stroke="#5aa6e8" stroke-width="1.5"/>', s),
  clock: (s = 32) => tile("#2b2f36", '<circle cx="16" cy="16" r="9" fill="#fff"/><path d="M16 11v5l4 2" fill="none" stroke="#2b2f36" stroke-width="2" stroke-linecap="round"/>', s),
  snip: (s = 32) => tile("#e8f1ff", '<circle cx="11" cy="21" r="3.5" fill="none" stroke="#c42b1c" stroke-width="2"/><circle cx="21" cy="21" r="3.5" fill="none" stroke="#c42b1c" stroke-width="2"/><path d="M13 18l9-11M19 18l-9-11" stroke="#2f6fde" stroke-width="2" stroke-linecap="round"/>', s),
  paint: (s = 32) => tile("#fff4e0", '<circle cx="12" cy="13" r="2.5" fill="#e74c3c"/><circle cx="19" cy="11" r="2.5" fill="#3498db"/><circle cx="21" cy="18" r="2.5" fill="#2ecc71"/><path d="M8 24c3-1 4-4 7-4" stroke="#8a5a2b" stroke-width="2.5" fill="none"/>', s),
  doc: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M6 2h8l5 5v15H6z" fill="#fff" stroke="#8a8a8a"/><path d="M14 2v5h5" fill="none" stroke="#8a8a8a"/></svg>`,
  power: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20"><path d="M6 5a7 7 0 1 0 8 0" fill="none" stroke="#333" stroke-width="1.8" stroke-linecap="round"/><line x1="10" y1="2" x2="10" y2="9" stroke="#333" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  wifi: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20"><path d="M2 8a12 12 0 0 1 16 0M5 11a8 8 0 0 1 10 0M8 14a3.5 3.5 0 0 1 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  speaker: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20"><path d="M3 8h3l5-4v12l-5-4H3z" fill="currentColor"/><path d="M14 7a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  battery: (s = 22) => `<svg width="${s}" height="${s * 0.6}" viewBox="0 0 22 13"><rect x=".5" y=".5" width="18" height="12" rx="2.5" fill="none" stroke="currentColor"/><rect x="2.5" y="2.5" width="12" height="8" rx="1" fill="currentColor"/><rect x="19.5" y="4" width="2" height="5" rx="1" fill="currentColor"/></svg>`,
};

export const WIN_CURSOR =
  '<svg viewBox="0 0 30 44"><path d="M2 2v34l9-8 6 13 6-3-6-13h12z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>';
export const WIN_CROSSHAIR =
  '<svg viewBox="0 0 30 44"><path d="M15 6v32M1 22h28" stroke="#000" stroke-width="4"/><path d="M15 6v32M1 22h28" stroke="#fff" stroke-width="2"/></svg>';
