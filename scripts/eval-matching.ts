// Measures how well search maps plain-language questions to walkthroughs.
//
// Builds a throwaway database (walkthrough_eval) next to the main one, loads
// every walkthrough in library/catalog.json as published, and runs the
// question sets in e2e/matching-questions.json through the real search.
//
// Usage: npm run eval:matching [-- --set practice|test|all] [-- --verbose]
// Phase 3 acceptance: the test set must open the right walkthrough 27+ of 30.
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { scrubPersonalInfo } from "../src/lib/scrub";
import { searchWalkthroughs, type Device } from "../src/lib/search";
import catalog from "../library/catalog.json";
import questions from "../e2e/matching-questions.json";

const THRESHOLD = Number(process.env.MATCH_CONFIDENCE_THRESHOLD ?? 0.75);
const REQUIRED = 27;

const args = process.argv.slice(2);
const setArg = args.includes("--set") ? args[args.indexOf("--set") + 1] : "all";
const verbose = args.includes("--verbose");

async function makeEvalDatabase() {
  const base = new URL(process.env.DATABASE_URL!);
  const evalUrl = new URL(base);
  evalUrl.pathname = "/walkthrough_eval";

  const admin = new Client({ connectionString: base.toString() });
  await admin.connect();
  await admin.query("DROP DATABASE IF EXISTS walkthrough_eval WITH (FORCE)");
  await admin.query("CREATE DATABASE walkthrough_eval");
  await admin.end();

  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: evalUrl.toString() }, stdio: "ignore" });

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: evalUrl.toString() }) });
  await db.walkthrough.createMany({
    data: catalog.walkthroughs.map((w) => ({
      slug: w.slug,
      title: w.title,
      device: w.device as Device,
      osVersions: [],
      category: w.category,
      summary: w.summary,
      synonyms: w.synonyms,
      status: "published" as const,
    })),
  });
  return db;
}

async function runSet(db: PrismaClient, name: string, set: { q: string; expect: string }[]) {
  let top1 = 0;
  let top3 = 0;
  let opensDirectly = 0;
  let opensWrong = 0;
  console.log(`\n${name} (${set.length} questions)`);
  for (const { q, expect } of set) {
    const matches = await searchWalkthroughs(db, scrubPersonalInfo(q), {
      organizationId: null,
      devices: ["iphone", "windows"],
      includeDrafts: false,
    });
    const first = matches[0];
    const right = first?.slug === expect;
    const inTop3 = matches.some((m) => m.slug === expect);
    const direct = !!first && first.confidence >= THRESHOLD;
    top1 += right ? 1 : 0;
    top3 += inTop3 ? 1 : 0;
    opensDirectly += direct && right ? 1 : 0;
    opensWrong += direct && !right ? 1 : 0;
    if (verbose || !right) {
      const mark = right ? "✓" : inTop3 ? "~" : "✗";
      const shown = matches.map((m) => `${m.slug} ${m.score.toFixed(2)}`).join(", ") || "(nothing)";
      console.log(`  ${mark} "${q}"\n      expected ${expect}; got ${shown}; confidence ${first?.confidence ?? 0}${direct ? " (opens directly)" : ""}`);
    }
  }
  console.log(`  Right walkthrough first: ${top1}/${set.length}`);
  console.log(`  Right walkthrough in top 3: ${top3}/${set.length}`);
  console.log(`  Opened directly (confidence >= ${THRESHOLD}): ${opensDirectly} right, ${opensWrong} wrong`);
  return top1;
}

async function main() {
  const db = await makeEvalDatabase();
  try {
    if (setArg === "practice" || setArg === "all") await runSet(db, "Practice set", questions.practice);
    if (setArg === "test" || setArg === "all") {
      const score = await runSet(db, "Test set", questions.test);
      console.log(score >= REQUIRED ? `\nPASS: ${score}/30 (need ${REQUIRED})` : `\nFAIL: ${score}/30 (need ${REQUIRED})`);
      if (score < REQUIRED) process.exitCode = 1;
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
