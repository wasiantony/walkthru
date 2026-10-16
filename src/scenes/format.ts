// Drawn scenes: the data that describes what a step's picture shows, what the
// hand or mouse does, and what gets the orange outline. Rendered by the scene
// kit in src/scenes; never generated at runtime.
//
// Element names used by `target`, `reveal` and `highlight` are the
// `data-target` names the kit renders (for example "start-button", or a list
// row's own `id`). The e2e tests check every one of them exists.
import { z } from "zod";

export const PHONE_GLYPHS = ["plane", "wifi", "bars", "bell", "moon", "person", "sun", "gear", "dot"] as const;

const name = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Names are lowercase words joined by dashes.");
const percent = z.number().min(0).max(100);

// ---------- iPhone ----------

const phoneIcon = z.object({
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  glyph: z.enum(PHONE_GLYPHS),
});

const phoneRow = z.object({
  id: name.optional(),
  label: z.string().min(1),
  sub: z.string().optional(),
  icon: phoneIcon.optional(),
  // Initials shown in a round picture, for the account row.
  avatar: z.string().max(3).optional(),
  value: z.string().optional(),
  accessory: z.enum(["chevron", "switch-off", "switch-on", "none"]).default("chevron"),
});

const phoneGroup = z.union([
  z.object({ kind: z.literal("appearance"), header: z.string().optional() }),
  z.object({ kind: z.literal("brightness"), header: z.string().optional() }),
  z.object({ header: z.string().optional(), rows: z.array(phoneRow).min(1) }),
]);

const iphoneHome = z.object({ screen: z.literal("iphone/home") });

const iphoneList = z.object({
  screen: z.literal("iphone/list"),
  title: z.string().min(1),
  // Label of the back button at the top left; omit on a top-level page.
  back: z.string().optional(),
  // Big bold title that scrolls with the list, like the main Settings page.
  large: z.boolean().default(false),
  search: z.boolean().default(false),
  // Start already scrolled so this row is in view.
  scroll_to: name.optional(),
  groups: z.array(phoneGroup).min(1),
});

export const TEXT_SIZE_STOPS = [14, 15, 16, 17, 19, 22, 25] as const;

const iphoneTextSize = z.object({
  screen: z.literal("iphone/text-size"),
  title: z.string().default("Text Size"),
  back: z.string().default("Back"),
  sample: z.string().min(1),
  // Slider position, 0 (smallest) to 6 (largest). 3 is the phone's default.
  value: z.number().int().min(0).max(TEXT_SIZE_STOPS.length - 1).default(3),
});

// ---------- Windows ----------

const point = z.tuple([percent, percent]);
const rect = z.tuple([percent, percent, percent, percent]); // x, y, w, h

const appWindow = z.discriminatedUnion("app", [
  z.object({
    app: z.literal("mail"),
    to: z.string().default("Front desk"),
    subject: z.string().default(""),
    body: z.string().default(""),
  }),
  z.object({ app: z.literal("snipping-tool") }),
]);

const windowsDesktop = z.object({
  screen: z.literal("windows/desktop"),
  // Open windows, back to front.
  windows: z.array(appWindow).default([]),
  start: z
    .object({
      view: z.enum(["pinned", "search"]).default("pinned"),
      query: z.string().default(""),
      account_menu: z.boolean().default(false),
    })
    .optional(),
  // Screen dimmed for a Snipping Tool capture; `box` is the picked area.
  snip: z.object({ box: rect }).optional(),
  menu: z
    .object({
      at: point,
      items: z.array(z.object({ id: name.optional(), label: z.string().min(1), disabled: z.boolean().default(false) })).min(1),
    })
    .optional(),
  // A small drawing of a mouse in the corner, for steps about its buttons.
  mouse: z.boolean().default(false),
  toast: z.object({ title: z.string().min(1), body: z.string().default("") }).optional(),
});

const windowsLock = z.object({ screen: z.literal("windows/lock") });

export const sceneSchema = z.discriminatedUnion("screen", [
  iphoneHome,
  iphoneList,
  iphoneTextSize,
  windowsDesktop,
  windowsLock,
]);

// ---------- Gestures ----------

export const gestureSchema = z.discriminatedUnion("type", [
  // Finger taps something (iPhone).
  z.object({ type: z.literal("tap"), target: name }),
  // Mouse clicks something (Windows).
  z.object({ type: z.literal("click"), target: name }),
  z.object({ type: z.literal("right-click"), target: name }),
  // Finger slides up the list until `reveal` is in view (iPhone lists).
  z.object({ type: z.literal("scroll"), reveal: name }),
  // Finger drags the text size slider from the scene's value to `to`.
  z.object({ type: z.literal("slide"), to: z.number().int().min(0).max(TEXT_SIZE_STOPS.length - 1) }),
  // Letters appear one by one in `target`. The scene shows the finished text;
  // anything that appears because of the typing is shown once it's done.
  z.object({ type: z.literal("type"), target: name }),
  // Mouse drags out the Snipping Tool box shown in the scene.
  z.object({ type: z.literal("drag-box") }),
]);

export type Scene = z.infer<typeof sceneSchema>;
export type Gesture = z.infer<typeof gestureSchema>;
export type SceneDevice = "iphone" | "windows";

export function sceneDevice(scene: Scene): SceneDevice {
  return scene.screen.startsWith("iphone/") ? "iphone" : "windows";
}
