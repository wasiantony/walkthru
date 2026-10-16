// Reads and validates walkthrough folders from /library/<device>/<slug>/.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { DEVICES, isSceneStep, walkthroughSchema, type WalkthroughFile } from "./walkthrough-format";

export type LibraryEntry = {
  dir: string;
  walkthrough: WalkthroughFile;
};

export type LibraryProblem = {
  dir: string;
  message: string;
};

export function readLibrary(
  libraryRoot: string,
  { checkImages = true }: { checkImages?: boolean } = {},
): { entries: LibraryEntry[]; problems: LibraryProblem[] } {
  const entries: LibraryEntry[] = [];
  const problems: LibraryProblem[] = [];

  for (const device of DEVICES) {
    const deviceDir = path.join(libraryRoot, device);
    if (!existsSync(deviceDir)) continue;

    for (const slug of readdirSync(deviceDir).sort()) {
      const dir = path.join(deviceDir, slug);
      if (!statSync(dir).isDirectory()) continue;

      const jsonPath = path.join(dir, "walkthrough.json");
      if (!existsSync(jsonPath)) {
        problems.push({ dir, message: "Missing walkthrough.json" });
        continue;
      }

      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(jsonPath, "utf8"));
      } catch (err) {
        problems.push({ dir, message: `walkthrough.json is not valid JSON: ${(err as Error).message}` });
        continue;
      }

      const parsed = walkthroughSchema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          problems.push({ dir, message: `${issue.path.join(".") || "(root)"}: ${issue.message}` });
        }
        continue;
      }

      const walkthrough = parsed.data;
      if (walkthrough.slug !== slug) {
        problems.push({ dir, message: `slug "${walkthrough.slug}" must match its folder name "${slug}"` });
        continue;
      }
      if (walkthrough.device !== device) {
        problems.push({ dir, message: `device "${walkthrough.device}" must match its parent folder "${device}"` });
        continue;
      }

      const missing = checkImages
        ? walkthrough.steps.flatMap((s) => (!isSceneStep(s) && !existsSync(path.join(dir, s.image)) ? [s.image] : []))
        : [];
      if (missing.length > 0) {
        problems.push({ dir, message: `Missing image files: ${missing.join(", ")}` });
        continue;
      }

      entries.push({ dir, walkthrough });
    }
  }

  return { entries, problems };
}
