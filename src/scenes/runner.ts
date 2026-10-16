// Plays a step's gesture over a rendered scene, and places the orange outline.
//
// Everything is positioned in the scene's own design coordinates (the
// unscaled screen), so the outline and pointer stay lined up with the drawing
// at any zoom or window size.
import type { Gesture, Scene, SceneDevice } from "./format";

export type SceneStep = { scene: Scene; gesture: Gesture | null; highlight: string | null };
export type Rect = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };

export type RunnerContext = {
  device: SceneDevice;
  screen: HTMLElement;
  pointer: HTMLElement;
  ripple: HTMLElement;
  highlight: HTMLElement;
  // Current CSS scale of the screen, and the part of it the viewer can see.
  scale: () => number;
  visible: () => Rect;
  reduced: boolean;
  signal: AbortSignal;
};

export const SCREEN_SIZE: Record<SceneDevice, { w: number; h: number }> = {
  iphone: { w: 390, h: 844 },
  windows: { w: 1280, h: 720 },
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function findTarget(screen: HTMLElement, name: string) {
  return screen.querySelector<HTMLElement>(`[data-target="${CSS.escape(name)}"]`);
}
function findPart(screen: HTMLElement, name: string) {
  return screen.querySelector<HTMLElement>(`[data-part="${name}"]`);
}

export function boxOf(ctx: Pick<RunnerContext, "screen" | "scale">, el: Element): Rect {
  const s = ctx.screen.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = ctx.scale();
  return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
}
const centerOf = (b: Rect): Point => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

// Design pixels per on-screen pixel, for things drawn at a constant on-screen
// size (matches --sc-inv in scenes.css).
const inv = (ctx: RunnerContext) => Math.max(1, 1 / ctx.scale());

// ---------- Scene state that gestures change ----------

function setScroll(ctx: RunnerContext, px: number) {
  const scroller = findPart(ctx.screen, "scroller");
  if (scroller) scroller.style.transform = px ? `translateY(${-px}px)` : "";
}

// How far to scroll so `name` sits comfortably in view.
function revealOffset(ctx: RunnerContext, name: string) {
  setScroll(ctx, 0);
  const el = findTarget(ctx.screen, name);
  return el ? Math.max(0, boxOf(ctx, el).y - 400) : 0;
}

function sizes(ctx: RunnerContext) {
  return (findPart(ctx.screen, "sample")?.dataset.sizes ?? "").split(",").map(Number);
}
function setTextSize(ctx: RunnerContext, i: number) {
  const all = sizes(ctx);
  const sample = findPart(ctx.screen, "sample");
  const thumb = findPart(ctx.screen, "thumb");
  if (sample) sample.style.fontSize = `${all[i]}px`;
  if (thumb) thumb.style.left = `${(i / (all.length - 1)) * 100}%`;
}

function setRevealed(ctx: RunnerContext, shown: boolean) {
  ctx.screen.querySelectorAll("[data-reveal-after]").forEach((el) => el.classList.toggle("is-waiting", !shown));
}

/** Applies any starting state the scene asks for (e.g. a list already scrolled). */
export function prepareScene(ctx: RunnerContext) {
  const scrollTo = findPart(ctx.screen, "scroller")?.dataset.scrollTo;
  if (scrollTo) setScroll(ctx, revealOffset(ctx, scrollTo));
}

/** Shows how the screen looks once the gesture is done, with no animation. */
export function applyEndState(ctx: RunnerContext, step: SceneStep) {
  const g = step.gesture;
  if (g?.type === "scroll") setScroll(ctx, revealOffset(ctx, g.reveal));
  if (g?.type === "slide") setTextSize(ctx, g.to);
}

// ---------- Outline ----------

/** Re-measures the outline after the picture changes size. */
export function refreshHighlight(ctx: RunnerContext) {
  const name = ctx.highlight.dataset.for;
  if (name && ctx.highlight.classList.contains("is-shown")) placeHighlight(ctx, name);
}

export function showHighlight(ctx: RunnerContext, name: string | null) {
  if (!name || !placeHighlight(ctx, name)) return;
  // A soft pulse that stops after a few seconds; the outline itself stays.
  if (!ctx.reduced) {
    const spread = 18 * inv(ctx);
    ctx.highlight.animate(
      [{ boxShadow: "0 0 0 0 rgba(255,106,0,.6)" }, { boxShadow: `0 0 0 ${spread}px rgba(255,106,0,0)` }],
      { duration: 1300, iterations: 3, easing: "ease-out" },
    );
  }
}

function placeHighlight(ctx: RunnerContext, name: string) {
  const el = findTarget(ctx.screen, name);
  if (!el) return false;
  const { w: W, h: H } = SCREEN_SIZE[ctx.device];
  const b = boxOf(ctx, el);
  // Room for the 5px outline plus a small gap, so it never covers the target.
  const pad = 8 * inv(ctx);
  const x = clamp(b.x - pad, 3, W - 6);
  const y = clamp(b.y - pad, 3, H - 6);
  const w = Math.min(b.w + pad * 2, W - 3 - x);
  const h = Math.min(b.h + pad * 2, H - 3 - y);
  Object.assign(ctx.highlight.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  ctx.highlight.dataset.for = name;
  ctx.highlight.classList.add("is-shown");
  return true;
}

// ---------- Pointer animation ----------

function pose(ctx: RunnerContext, p: Point, s = 1, o = 1): Keyframe {
  // The finger is centred on the point; the mouse pointer's tip sits on it.
  const [dx, dy] = ctx.device === "iphone" ? [29, 29] : [2 * inv(ctx), 2 * inv(ctx)];
  return { transform: `translate(${p.x - dx}px, ${p.y - dy}px) scale(${s})`, opacity: o };
}

async function animate(ctx: RunnerContext, el: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
  if (ctx.signal.aborted) return false;
  const a = el.animate(frames, { fill: "forwards", ...options });
  const stop = () => a.cancel();
  ctx.signal.addEventListener("abort", stop, { once: true });
  try {
    await a.finished;
  } catch {
    // cancelled
  } finally {
    ctx.signal.removeEventListener("abort", stop);
  }
  return !ctx.signal.aborted;
}

function wait(ctx: RunnerContext, ms: number) {
  return new Promise<boolean>((resolve) => {
    const t = setTimeout(() => resolve(!ctx.signal.aborted), ms);
    ctx.signal.addEventListener("abort", () => { clearTimeout(t); resolve(false); }, { once: true });
  });
}

function ripple(ctx: RunnerContext, p: Point) {
  const r = ctx.device === "iphone" ? 29 : 16 * inv(ctx);
  ctx.ripple.animate(
    [
      { transform: `translate(${p.x - r}px, ${p.y - r}px) scale(.5)`, opacity: 0.95 },
      { transform: `translate(${p.x - r}px, ${p.y - r}px) scale(2.2)`, opacity: 0 },
    ],
    { duration: 650, easing: "ease-out" },
  );
}

// A starting point near the target that the viewer can see.
function approachFrom(ctx: RunnerContext, p: Point): Point {
  const v = ctx.visible();
  const [dx, dy] = ctx.device === "iphone" ? [80, 150] : [140, 110];
  const x = clamp(p.x + dx, v.x + 20, v.x + v.w - 40);
  const below = p.y + dy;
  const y = below < v.y + v.h - 40 ? below : clamp(p.y - dy, v.y + 20, v.y + v.h - 40);
  return { x, y };
}

async function moveIn(ctx: RunnerContext, to: Point) {
  const from = approachFrom(ctx, to);
  return (
    (await animate(ctx, ctx.pointer, [pose(ctx, from, 1, 0), pose(ctx, from)], { duration: 250 })) &&
    (await animate(ctx, ctx.pointer, [pose(ctx, from), pose(ctx, to)], { duration: 850, easing: "ease-in-out" }))
  );
}

async function press(ctx: RunnerContext, at: Point) {
  ripple(ctx, at);
  return (
    (await animate(ctx, ctx.pointer, [pose(ctx, at), pose(ctx, at, 0.82)], { duration: 140 })) &&
    (await animate(ctx, ctx.pointer, [pose(ctx, at, 0.82), pose(ctx, at)], { duration: 160 }))
  );
}

async function moveOut(ctx: RunnerContext, from: Point) {
  if (!(await wait(ctx, 400))) return false;
  const away = ctx.device === "iphone" ? { x: from.x + 30, y: from.y + 70 } : { x: from.x + 40, y: from.y + 40 };
  return animate(ctx, ctx.pointer, [pose(ctx, from), pose(ctx, away, 1, 0)], { duration: 500 });
}

async function tapOrClick(ctx: RunnerContext, name: string, right = false) {
  const el = findTarget(ctx.screen, name);
  if (!el) return;
  const at = centerOf(boxOf(ctx, el));
  if (!(await moveIn(ctx, at))) return;
  const button = right ? findPart(ctx.screen, "mouse-right") : null;
  button?.classList.add("is-pressed");
  if (!(await press(ctx, at))) return;
  if (!(await wait(ctx, 300))) return;
  button?.classList.remove("is-pressed");
  await moveOut(ctx, at);
}

async function scroll(ctx: RunnerContext, reveal: string) {
  const total = revealOffset(ctx, reveal);
  const half = total / 2;
  const scroller = findPart(ctx.screen, "scroller");
  if (!scroller) return;
  for (let n = 0; n < 2; n++) {
    const a = { x: 250, y: 640 };
    const b = { x: 250, y: 640 - half };
    if (!(await animate(ctx, ctx.pointer, [pose(ctx, a, 1, 0), pose(ctx, a)], { duration: 220 }))) return;
    const ease = "cubic-bezier(.3,.1,.25,1)";
    const list = scroller.animate(
      [{ transform: `translateY(${-half * n}px)` }, { transform: `translateY(${-half * (n + 1)}px)` }],
      { duration: 1000, easing: ease, fill: "forwards" },
    );
    const moved = await animate(ctx, ctx.pointer, [pose(ctx, a), pose(ctx, b)], { duration: 1000, easing: ease });
    setScroll(ctx, half * (n + 1));
    list.cancel();
    if (!moved) return;
    if (!(await animate(ctx, ctx.pointer, [pose(ctx, b), pose(ctx, b, 1, 0)], { duration: 250 }))) return;
    if (!(await wait(ctx, 250))) return;
  }
}

async function slide(ctx: RunnerContext, from: number, to: number) {
  const track = findPart(ctx.screen, "track");
  const thumb = findPart(ctx.screen, "thumb");
  if (!track || !thumb) return;
  const last = sizes(ctx).length - 1;
  const tb = boxOf(ctx, track);
  const at = (i: number) => ({ x: tb.x + (tb.w * i) / last, y: tb.y + tb.h / 2 });
  const a = at(from);
  const b = at(to);
  if (!(await moveIn(ctx, a))) return;
  if (!(await animate(ctx, ctx.pointer, [pose(ctx, a), pose(ctx, a, 0.82)], { duration: 140 }))) return;
  const span = 1400;
  const knob = thumb.animate([{ left: `${(from / last) * 100}%` }, { left: `${(to / last) * 100}%` }], {
    duration: span,
    fill: "forwards",
  });
  // Grow the sample words as the round button passes each stop.
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (let k = from + 1; k <= to; k++) {
    timers.push(setTimeout(() => !ctx.signal.aborted && setTextSize(ctx, k), (span * (k - from)) / (to - from) - 60));
  }
  ctx.signal.addEventListener("abort", () => timers.forEach(clearTimeout), { once: true });
  const moved = await animate(ctx, ctx.pointer, [pose(ctx, a, 0.82), pose(ctx, b, 0.82)], { duration: span });
  setTextSize(ctx, to);
  knob.cancel();
  if (!moved) return;
  if (!(await animate(ctx, ctx.pointer, [pose(ctx, b, 0.82), pose(ctx, b)], { duration: 160 }))) return;
  await moveOut(ctx, b);
}

async function type(ctx: RunnerContext, name: string) {
  const field = findTarget(ctx.screen, name);
  const text = field?.querySelector<HTMLElement>('[data-part="typing"]');
  if (!field || !text) return;
  // The finished text comes from the scene, not the page, so a replay that
  // starts mid-way through an earlier one still types the whole thing.
  const full = text.dataset.text ?? "";
  text.textContent = "";
  setRevealed(ctx, false);
  for (let i = 1; i <= full.length; i++) {
    if (!(await wait(ctx, 110))) {
      text.textContent = full;
      setRevealed(ctx, true);
      return;
    }
    text.textContent = full.slice(0, i);
  }
  await wait(ctx, 250);
  setRevealed(ctx, true);
}

async function dragBox(ctx: RunnerContext) {
  const box = findPart(ctx.screen, "snip-box");
  if (!box) return;
  const end = { w: Number(box.dataset.w), h: Number(box.dataset.h) };
  const a = { x: box.offsetLeft, y: box.offsetTop };
  const b = { x: a.x + end.w, y: a.y + end.h };
  Object.assign(box.style, { width: "0px", height: "0px" });
  if (!(await moveIn(ctx, a))) return restore();
  ripple(ctx, a);
  if (!(await animate(ctx, ctx.pointer, [pose(ctx, a), pose(ctx, a, 0.85)], { duration: 140 }))) return restore();
  const span = 1500;
  const grow = box.animate([{ width: "0px", height: "0px" }, { width: `${end.w}px`, height: `${end.h}px` }], {
    duration: span,
    easing: "ease-in-out",
    fill: "forwards",
  });
  const moved = await animate(ctx, ctx.pointer, [pose(ctx, a, 0.85), pose(ctx, b, 0.85)], { duration: span, easing: "ease-in-out" });
  restore();
  grow.cancel();
  if (!moved) return;
  ripple(ctx, b);
  if (!(await animate(ctx, ctx.pointer, [pose(ctx, b, 0.85), pose(ctx, b)], { duration: 160 }))) return;
  await moveOut(ctx, b);

  function restore() {
    Object.assign(box!.style, { width: `${end.w}px`, height: `${end.h}px` });
  }
}

/** Plays the step from the start: outline, then the gesture. */
export async function playStep(ctx: RunnerContext, step: SceneStep) {
  const g = step.gesture;
  const outlineAfter = g?.type === "scroll";

  if (ctx.reduced || !g) {
    applyEndState(ctx, step);
    showHighlight(ctx, step.highlight);
    return;
  }

  if (!outlineAfter) showHighlight(ctx, step.highlight);
  if (!(await wait(ctx, 600))) return;

  if (g.type === "tap" || g.type === "click") await tapOrClick(ctx, g.target);
  else if (g.type === "right-click") await tapOrClick(ctx, g.target, true);
  else if (g.type === "scroll") await scroll(ctx, g.reveal);
  else if (g.type === "slide") await slide(ctx, step.scene.screen === "iphone/text-size" ? step.scene.value : 3, g.to);
  else if (g.type === "type") await type(ctx, g.target);
  else if (g.type === "drag-box") await dragBox(ctx);

  if (!ctx.signal.aborted && outlineAfter) showHighlight(ctx, step.highlight);
}
