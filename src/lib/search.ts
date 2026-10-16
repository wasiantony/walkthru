// Finds the walkthroughs that best match a staff question, using Postgres
// full-text search plus fuzzy phrase matching. No AI and no outside service:
// the question never leaves the server.
//
// Each candidate gets a score from three signals:
//   - words: how well the question's words match the title, alternative
//     phrasings, summary and category (Postgres full-text ranking)
//   - phrase: how closely one of the walkthrough's phrasings appears inside the
//     question, allowing for typos (pg_trgm)
//   - device: a boost when the question names the right kind of device
// and a confidence (0 to 1) that says how clearly the top match beats the rest.
import type { PrismaClient } from "@/generated/prisma/client";

export type Device = "iphone" | "windows";

export type SearchOptions = {
  organizationId: string | null;
  devices: Device[];
  includeDrafts: boolean;
  limit?: number;
};

export type Match = {
  id: string;
  slug: string;
  title: string;
  device: Device;
  score: number;
  confidence: number;
};

// Everyday shorthand rewritten to the words the library uses.
const SHORTHAND: [RegExp, string][] = [
  [/\bpics?\b/g, "picture"],
  [/\bphotos?\b/g, "photo"],
  [/\bscreen ?shots?\b/g, "screenshot"],
  [/\btxts?\b/g, "text"],
  [/\bmsgs?\b/g, "message"],
  [/\bpcs?\b/g, "computer"],
  [/\bwi[\s-]?fi\b/g, "wifi"],
  [/\be-?mails?\b/g, "email"],
  [/\bdocs?\b/g, "document"],
  [/\bpw(d)?\b/g, "password"],
  [/\bpasscode\b/g, "passcode"],
  [/\bcant\b/g, "can't"],
  [/\bwont\b/g, "won't"],
  [/\bdont\b/g, "don't"],
  [/\bdoesnt\b/g, "doesn't"],
  [/\bthx\b/g, ""],
  [/\b(pls|plz|please)\b/g, ""],
];

const PHONE_WORDS = /\b(iphone|phone|cell|cellphone|mobile|smartphone|ipad)\b/;
const COMPUTER_WORDS = /\b(computer|laptop|desktop|pc|windows|monitor|keyboard|mouse|outlook|word|excel)\b/;

export function normalizeQuestion(question: string) {
  let text = question.toLowerCase().replace(/\[(name|email|number|address)\]/g, " ");
  for (const [pattern, replacement] of SHORTHAND) text = text.replace(pattern, replacement);
  return text.replace(/[^a-z0-9'\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function deviceHint(text: string): Device | null {
  const phone = PHONE_WORDS.test(text);
  const computer = COMPUTER_WORDS.test(text);
  if (phone && !computer) return "iphone";
  if (computer && !phone) return "windows";
  return null;
}

// Words that only say which device the question is about. They decide the
// device boost but are left out of matching, or every walkthrough that
// mentions "phone" would look like a match.
const DEVICE_ONLY_WORDS = /\b(iphone|phone|cell|cellphone|mobile|smartphone|ipad|computer|laptop|desktop|pc|my)\b/g;

function matchingText(text: string) {
  const stripped = text.replace(DEVICE_ONLY_WORDS, " ").replace(/\s+/g, " ").trim();
  return stripped || text;
}

type Row = { id: string; slug: string; title: string; device: Device; words: number; phrase: number };

// Weights, tuned on the practice questions only (e2e/matching-questions.json).
const W_WORDS = 1.0;
const W_PHRASE = 1.0;
const DEVICE_MATCH = 0.15;
const DEVICE_MISMATCH = 0.5; // multiplier
const MIN_SCORE = 0.12;

export async function searchWalkthroughs(db: PrismaClient, question: string, opts: SearchOptions): Promise<Match[]> {
  const normalized = normalizeQuestion(question);
  if (!normalized || opts.devices.length === 0) return [];
  const hint = deviceHint(normalized);
  const text = matchingText(normalized);

  // words: share of the question's (stemmed) words found in the walkthrough,
  // counting the title and phrasings fully, the summary at half and the
  // category at a fifth.
  const rows = await db.$queryRaw<Row[]>`
    WITH q AS (SELECT tsvector_to_array(to_tsvector('english', ${text})) AS lex)
    SELECT w.id, w.slug, w.title, w.device::text AS device,
      (
        SELECT coalesce(sum(greatest(
          CASE WHEN l = ANY(d.main) THEN 1.0 ELSE 0 END,
          CASE WHEN l = ANY(d.summary) THEN 0.5 ELSE 0 END,
          CASE WHEN l = ANY(d.category) THEN 0.2 ELSE 0 END
        )), 0) / greatest(1, cardinality(q.lex))
        FROM unnest(q.lex) AS l
      )::float8 AS words,
      (
        SELECT coalesce(max(strict_word_similarity(lower(s), ${text})), 0)
        FROM unnest(array_append(w.synonyms, w.title)) AS s
      )::float8 AS phrase
    FROM walkthroughs w
    CROSS JOIN q
    CROSS JOIN LATERAL (
      SELECT
        tsvector_to_array(to_tsvector('english', w.title || ' ' || array_to_string(w.synonyms, ' '))) AS main,
        tsvector_to_array(to_tsvector('english', w.summary)) AS summary,
        tsvector_to_array(to_tsvector('english', w.category)) AS category
    ) AS d
    WHERE (w.status = 'published' OR ${opts.includeDrafts})
      AND w.device::text = ANY(${opts.devices})
      AND (w.organization_id IS NULL OR w.organization_id = ${opts.organizationId})
      AND NOT EXISTS (
        SELECT 1 FROM hidden_walkthroughs h
        WHERE h.walkthrough_id = w.id AND h.organization_id = ${opts.organizationId}
      )
  `;

  const scored = rows
    .map((r) => {
      // Squaring the phrase match favours near-complete phrases over a
      // single shared word.
      let score = W_WORDS * r.words + W_PHRASE * r.phrase * r.phrase;
      if (hint && r.device === hint) score += DEVICE_MATCH;
      if (hint && r.device !== hint) score *= DEVICE_MISMATCH;
      return { id: r.id, slug: r.slug, title: r.title, device: r.device, score };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 3);

  return scored.map((m, i) => ({ ...m, confidence: i === 0 ? confidence(m.score, scored[1]?.score ?? 0) : 0 }));
}

// How sure we are the top match is the one: a strong score that clearly beats
// the runner-up gives a high number.
function confidence(top: number, second: number) {
  const strength = Math.min(1, top / 1.2);
  const margin = top > 0 ? (top - second) / top : 0;
  return Math.round(Math.min(1, strength * 0.5 + margin * 0.8) * 100) / 100;
}
