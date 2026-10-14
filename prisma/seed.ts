// Loads the version-controlled walkthrough library (/library) into the
// database as global walkthroughs (organization_id = null), and copies each
// step's screenshot into image storage.
//
// Safe to run repeatedly: walkthroughs are matched by slug and updated, and
// their steps are replaced. Walkthroughs removed from /library are reported but
// not deleted, so nothing disappears from staff without a human deciding.
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readLibrary } from "../src/lib/library";
import { contentTypeFor, getStorage } from "../src/lib/storage";
import { PLACEHOLDER_IMAGE_PATTERN } from "../src/lib/walkthrough-format";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const storage = getStorage();

async function main() {
  const libraryRoot = path.resolve(process.env.LIBRARY_DIR ?? "library");
  const { entries, problems } = readLibrary(libraryRoot);

  if (problems.length) {
    console.error("The library has problems. Nothing was loaded.");
    for (const p of problems) console.error(`  ✗ ${path.relative(libraryRoot, p.dir)}: ${p.message}`);
    process.exit(1);
  }

  for (const { dir, walkthrough: wt } of entries) {
    // Copy screenshots into storage first so steps never point at missing images.
    const imageKeys = new Map<string, string>();
    for (const step of wt.steps) {
      const key = `library/${wt.device}/${wt.slug}/${step.image}`;
      await storage.put(key, await readFile(path.join(dir, step.image)), contentTypeFor(step.image));
      imageKeys.set(step.image, key);
    }

    const data = {
      title: wt.title,
      device: wt.device,
      osVersions: wt.os_versions,
      category: wt.category,
      summary: wt.summary,
      synonyms: wt.synonyms,
      bonusTip: wt.bonus_tip,
      status: wt.status,
      verifiedBy: wt.verified_by,
      verifiedOn: wt.verified_on ? new Date(`${wt.verified_on}T00:00:00Z`) : null,
    };

    await prisma.$transaction(async (tx) => {
      const existing = await tx.walkthrough.findFirst({
        where: { organizationId: null, slug: wt.slug },
        select: { id: true },
      });
      const saved = existing
        ? await tx.walkthrough.update({ where: { id: existing.id }, data })
        : await tx.walkthrough.create({ data: { ...data, slug: wt.slug, organizationId: null } });

      await tx.step.deleteMany({ where: { walkthroughId: saved.id } });
      await tx.step.createMany({
        data: wt.steps.map((s) => ({
          walkthroughId: saved.id,
          organizationId: null,
          order: s.order,
          text: s.text,
          imageKey: imageKeys.get(s.image)!,
          imageIsPlaceholder: PLACEHOLDER_IMAGE_PATTERN.test(s.image),
          highlightType: s.highlight?.type ?? null,
          highlightX: s.highlight?.x ?? null,
          highlightY: s.highlight?.y ?? null,
          highlightW: s.highlight?.type === "box" ? s.highlight.w : null,
          highlightH: s.highlight?.type === "box" ? s.highlight.h : null,
          highlightDirection: s.highlight?.type === "arrow" ? s.highlight.direction : null,
        })),
      });
    });

    console.log(`  ✓ ${wt.device}/${wt.slug} (${wt.steps.length} steps, ${wt.status})`);
  }

  const slugs = new Set(entries.map((e) => e.walkthrough.slug));
  const orphans = await prisma.walkthrough.findMany({
    where: { organizationId: null, slug: { notIn: [...slugs] } },
    select: { slug: true },
  });
  for (const o of orphans) console.warn(`  ! ${o.slug} is in the database but no longer in /library (left unchanged)`);

  console.log(`Loaded ${entries.length} walkthrough(s) from ${libraryRoot}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
