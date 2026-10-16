// Phase 2 acceptance: every sample plays at phone (375px) and laptop (1366px)
// widths, outlines stay on their target when the window is resized, and axe
// finds no accessibility violations.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readLibrary } from "../src/lib/library";
import { isSceneStep, type SceneStepFile, type WalkthroughFile } from "../src/lib/walkthrough-format";

const { entries } = readLibrary("library");
const walkthroughs: WalkthroughFile[] = entries.map((e) => e.walkthrough);

const VIEWPORTS = [
  { name: "phone", width: 375, height: 812, resizeTo: { width: 330, height: 700 } },
  { name: "laptop", width: 1366, height: 768, resizeTo: { width: 1024, height: 700 } },
];

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary, `axe violations at ${where}`).toEqual([]);
}

type Measured = { hl: DOMRect; target: DOMRect; stage: DOMRect; screen: DOMRect; shownFor: string | undefined };

async function measure(page: Page, name: string): Promise<Measured> {
  return page.evaluate((n) => {
    const hl = document.querySelector<HTMLElement>(".pl-stage .sc-highlight")!;
    const target = document.querySelector(`.pl-stage [data-target="${n}"]`)!;
    const stage = document.querySelector(".pl-picture")!;
    const screen = document.querySelector(".pl-stage .sc-screen")!;
    return {
      hl: hl.getBoundingClientRect().toJSON(),
      target: target.getBoundingClientRect().toJSON(),
      stage: stage.getBoundingClientRect().toJSON(),
      screen: screen.getBoundingClientRect().toJSON(),
      shownFor: hl.classList.contains("is-shown") ? hl.dataset.for : undefined,
    };
  }, name);
}

// The outline surrounds its target with a small even gap, and the target is
// inside the visible picture. Where a target runs to the edge of the drawn
// screen, the outline stays just inside that edge instead.
async function expectAligned(page: Page, name: string, where: string) {
  const m = await measure(page, name);
  expect(m.shownFor, `outline shown on ${name} at ${where}`).toBe(name);
  const tol = 1;
  const edge = 6; // how far inside the screen edge a clamped outline may sit
  const left = Math.max(m.target.left, m.screen.left + edge);
  const top = Math.max(m.target.top, m.screen.top + edge);
  const right = Math.min(m.target.right, m.screen.right - edge);
  const bottom = Math.min(m.target.bottom, m.screen.bottom - edge);
  expect(m.hl.left, `${where}: outline left`).toBeLessThanOrEqual(left + tol);
  expect(m.hl.top, `${where}: outline top`).toBeLessThanOrEqual(top + tol);
  expect(m.hl.right, `${where}: outline right`).toBeGreaterThanOrEqual(right - tol);
  expect(m.hl.bottom, `${where}: outline bottom`).toBeGreaterThanOrEqual(bottom - tol);
  const maxGap = 16;
  expect(m.target.left - m.hl.left, `${where}: gap left`).toBeLessThanOrEqual(maxGap);
  expect(m.hl.right - m.target.right, `${where}: gap right`).toBeLessThanOrEqual(maxGap);
  const cx = m.target.left + m.target.width / 2;
  const cy = m.target.top + m.target.height / 2;
  expect(cx > m.stage.left && cx < m.stage.right && cy > m.stage.top && cy < m.stage.bottom, `${where}: ${name} is in view`).toBe(true);
}

function targetsOf(step: SceneStepFile): string[] {
  const g = step.gesture;
  const names = [step.highlight];
  if (g && "target" in g) names.push(g.target);
  if (g?.type === "scroll") names.push(g.reveal);
  return names.filter((n): n is string => Boolean(n));
}

for (const vp of VIEWPORTS) {
  for (const w of walkthroughs) {
    test(`${w.slug} plays at ${vp.name} width, stays aligned, and passes axe`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/w/${w.slug}`);

      for (const [i, step] of w.steps.entries()) {
        const where = `${w.slug} step ${i + 1} (${vp.name})`;
        await expect(page.locator(".pl-count")).toHaveText(`Step ${i + 1} of ${w.steps.length}`);
        await expect(page.locator(".pl-words")).toHaveText(step.text);
        expect(isSceneStep(step), `${where} is a drawn step`).toBe(true);
        if (!isSceneStep(step)) continue;

        await expect(page.getByRole("img", { name: step.alt })).toBeVisible();
        for (const name of targetsOf(step)) {
          await expect(page.locator(`.pl-stage [data-target="${name}"]`), `${where}: "${name}" is drawn`).toHaveCount(1);
        }

        if (step.highlight) {
          await expect(page.locator(".pl-stage .sc-highlight.is-shown")).toHaveCount(1);
          await expectAligned(page, step.highlight, where);

          await page.setViewportSize(vp.resizeTo);
          await page.waitForTimeout(150);
          await expectAligned(page, step.highlight, `${where} after resize`);
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(150);
          await expectAligned(page, step.highlight, `${where} after resizing back`);
        }

        await expectNoAxeViolations(page, where);
        await page.getByRole("button", { name: i === w.steps.length - 1 ? "Finish" : "Next", exact: true }).click();
      }

      await expect(page.getByRole("heading", { name: "Did this solve it?" })).toBeFocused();
      await expectNoAxeViolations(page, `${w.slug} ending (${vp.name})`);
      await page.getByRole("button", { name: "No, I still need help" }).click();
      await expect(page.getByRole("button", { name: "Ask someone for help" })).toBeVisible();
      if (w.bonus_tip) await expect(page.getByText(w.bonus_tip)).toBeVisible();
    });
  }
}

for (const w of walkthroughs) {
  test(`${w.slug} animations finish without errors and end in the right state`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`/w/${w.slug}`);

    for (const [i, step] of w.steps.entries()) {
      if (!isSceneStep(step)) continue;
      await expect(page.locator(".pl-count")).toHaveText(`Step ${i + 1} of ${w.steps.length}`);
      // Wait for the hand or mouse to finish, then for the outline to stop
      // pulsing. (The blinking text cursor is a CSS animation that never ends.)
      await expect(page.locator('.pl-stage [data-played="true"]')).toHaveCount(1, { timeout: 20_000 });
      await page.waitForFunction(() => {
        const stage = document.querySelector(".pl-stage");
        return !!stage && stage.getAnimations({ subtree: true }).every((a) => a instanceof CSSAnimation || a.playState !== "running");
      }, undefined, { timeout: 20_000, polling: 250 });

      if (step.highlight) await expectAligned(page, step.highlight, `${w.slug} step ${i + 1} after animation`);

      const g = step.gesture;
      if (g?.type === "type") {
        const typing = page.locator('.pl-stage [data-part="typing"]');
        await expect(typing).toHaveText((await typing.getAttribute("data-text")) ?? "");
        await expect(page.locator(".pl-stage [data-reveal-after]")).not.toHaveClass(/is-waiting/);
      }
      if (g?.type === "drag-box") {
        const box = page.locator('.pl-stage [data-part="snip-box"]');
        const size = await box.evaluate((el: HTMLElement) => ({ w: el.offsetWidth, h: el.offsetHeight, dw: Number(el.dataset.w), dh: Number(el.dataset.h) }));
        expect(Math.abs(size.w - size.dw)).toBeLessThan(1.5);
        expect(Math.abs(size.h - size.dh)).toBeLessThan(1.5);
      }
      if (g?.type === "slide") {
        const sample = page.locator('.pl-stage [data-part="sample"]');
        const sizes = ((await sample.getAttribute("data-sizes")) ?? "").split(",");
        await expect(sample).toHaveCSS("font-size", `${sizes[g.to]}px`);
      }

      await page.getByRole("button", { name: i === w.steps.length - 1 ? "Finish" : "Next", exact: true }).click();
    }

    await expect(page.getByRole("heading", { name: "Did this solve it?" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("the picture opens big and closes again, and passes axe while open", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/w/${walkthroughs[0].slug}`);
  await page.locator(".pl-picture").click();
  const close = page.getByRole("button", { name: "Close big picture" });
  await expect(close).toBeFocused();
  await expectNoAxeViolations(page, "big picture");
  await page.keyboard.press("Escape");
  await expect(close).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Make picture bigger" })).toBeFocused();
});

test("an unknown walkthrough shows a friendly not-found page", async ({ page }) => {
  await page.goto("/w/no-such-walkthrough");
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
});
