// The walkthrough.json format used by /library/<device>/<slug>/.
// Shared by the seed script, the lint script, and (later) the admin importer.
import { z } from "zod";
import { gestureSchema, sceneDevice, sceneSchema } from "../scenes/format";

export const DEVICES = ["iphone", "windows"] as const;
export type Device = (typeof DEVICES)[number];

// Placeholder screenshots are named step-01.placeholder.png so they are easy
// to spot in review and can never be mistaken for a real capture.
export const PLACEHOLDER_IMAGE_PATTERN = /\.placeholder\.(png|jpe?g|webp)$/i;
export const IMAGE_FILE_PATTERN = /^[a-z0-9-]+(\.placeholder)?\.(png|jpe?g|webp)$/i;

const percent = z.number().min(0).max(100);

const boxHighlight = z
  .object({
    type: z.literal("box"),
    x: percent,
    y: percent,
    w: percent.positive(),
    h: percent.positive(),
  })
  .refine((h) => h.x + h.w <= 100 && h.y + h.h <= 100, {
    message: "Highlight box must stay inside the image (x + w and y + h must be 100 or less).",
  });

const arrowHighlight = z.object({
  type: z.literal("arrow"),
  // The point the arrow tip touches.
  x: percent,
  y: percent,
  // Which way the arrow points. "down" means it comes from above.
  direction: z.enum(["up", "down", "left", "right"]).default("down"),
});

export const highlightSchema = z.union([boxHighlight, arrowHighlight]);

// A step shows either a drawn scene (the default for the shared library) or a
// screenshot (for an organization's own apps, which have no drawings).
export const sceneStepSchema = z.object({
  order: z.number().int().positive(),
  text: z.string().trim().min(1),
  // Describes the picture for people who can't see it.
  alt: z.string().trim().min(1),
  scene: sceneSchema,
  gesture: gestureSchema.nullable().default(null),
  // data-target name of the element that gets the orange outline.
  highlight: z.string().nullable().default(null),
});

export const imageStepSchema = z.object({
  order: z.number().int().positive(),
  text: z.string().trim().min(1),
  alt: z.string().trim().min(1).optional(),
  image: z.string().regex(IMAGE_FILE_PATTERN, "Image must be a .png, .jpg or .webp file name with no folders."),
  highlight: highlightSchema.nullable().default(null),
});

export const stepSchema = z.union([sceneStepSchema, imageStepSchema]);

export function isSceneStep(step: StepFile): step is SceneStepFile {
  return "scene" in step;
}

export const walkthroughSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase words joined by dashes."),
    title: z.string().trim().min(1),
    device: z.enum(DEVICES),
    os_versions: z.array(z.string().trim().min(1)).min(1),
    category: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    synonyms: z.array(z.string().trim().min(1)).default([]),
    // Keyboard shortcuts and other extras go here, never in the main steps.
    bonus_tip: z.string().trim().min(1).nullable().default(null),
    status: z.enum(["draft", "published"]).default("draft"),
    verified_by: z.string().trim().min(1).nullable().default(null),
    verified_on: z.iso.date().nullable().default(null),
    steps: z.array(stepSchema).min(1),
  })
  .superRefine((w, ctx) => {
    w.steps.forEach((step, i) => {
      if (step.order !== i + 1) {
        ctx.addIssue({
          code: "custom",
          path: ["steps", i, "order"],
          message: `Steps must be numbered 1, 2, 3... in order. Expected ${i + 1}, found ${step.order}.`,
        });
      }
      if (isSceneStep(step) && sceneDevice(step.scene) !== w.device) {
        ctx.addIssue({
          code: "custom",
          path: ["steps", i, "scene", "screen"],
          message: `A ${w.device} walkthrough can't use the "${step.scene.screen}" screen.`,
        });
      }
    });

    if (w.status === "published") {
      if (!w.verified_by || !w.verified_on) {
        ctx.addIssue({
          code: "custom",
          path: ["status"],
          message: "A walkthrough can only be published after a human fills in verified_by and verified_on.",
        });
      }
      w.steps.forEach((step, i) => {
        if (!isSceneStep(step) && PLACEHOLDER_IMAGE_PATTERN.test(step.image)) {
          ctx.addIssue({
            code: "custom",
            path: ["steps", i, "image"],
            message: "A published walkthrough cannot use placeholder screenshots.",
          });
        }
      });
    }
  });

export type WalkthroughFile = z.infer<typeof walkthroughSchema>;
export type StepFile = z.infer<typeof stepSchema>;
export type SceneStepFile = z.infer<typeof sceneStepSchema>;
export type ImageStepFile = z.infer<typeof imageStepSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
