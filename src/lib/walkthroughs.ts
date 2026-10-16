import type { PlayerWalkthrough } from "@/components/player/Player";
import { prisma } from "@/lib/db";
import { gestureSchema, sceneSchema } from "@/scenes/format";

// Drafts are only shown when SHOW_DRAFTS=true (local development and review).
// Staff never see drafts in a normal deployment.
export function showDrafts() {
  return process.env.SHOW_DRAFTS === "true";
}

/** Loads a global library walkthrough for the player, or null if it isn't available. */
export async function getWalkthroughForPlayer(slug: string): Promise<PlayerWalkthrough | null> {
  const w = await prisma.walkthrough.findFirst({
    where: { organizationId: null, slug, ...(showDrafts() ? {} : { status: "published" }) },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!w) return null;

  return {
    title: w.title,
    status: w.status,
    bonusTip: w.bonusTip,
    steps: w.steps.map((s) => ({
      text: s.text,
      alt: s.alt ?? "",
      // Validated again on the way out, so a bad row can't break the player.
      scene: s.scene ? sceneSchema.parse(s.scene) : null,
      gesture: s.gesture ? gestureSchema.parse(s.gesture) : null,
      highlight: s.highlightTarget,
    })),
  };
}
