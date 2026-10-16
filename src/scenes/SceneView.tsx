"use client";

// Draws a step's scene inside a device frame, fits it to the space available,
// and plays its gesture. Remount it (change its `key`) to replay from the start.
import { useLayoutEffect, useRef } from "react";
import { sceneDevice } from "./format";
import { WIN_CURSOR } from "./kit/art";
import { Art } from "./kit/iphone";
import { Scene } from "./Scene";
import {
  boxOf,
  findTarget,
  playStep,
  prepareScene,
  refreshHighlight,
  SCREEN_SIZE,
  type Rect,
  type RunnerContext,
  type SceneStep,
} from "./runner";
import "./scenes.css";

const FRAME_PAD = { iphone: 8, windows: 12 } as const;

// Below this scale a whole screen is too small to read, so the view zooms in
// on the part of the screen the step is about.
const MIN_READABLE_SCALE = { iphone: 0.5, windows: 0.4 } as const;
// Narrowest slice of the Windows screen to zoom in to, in design pixels. The
// iPhone always keeps its full width and is only cropped top and bottom.
const MIN_ZOOM_WIDTH = 640;
// Gestures where the whole screen matters (a list moving, or the slider
// changing the words at the top), so the view never zooms in.
const SHOW_WHOLE_SCREEN = new Set(["scroll", "slide"]);

export function SceneView({ step, zoom = "auto" }: { step: SceneStep; zoom?: "auto" | "whole" }) {
  const device = sceneDevice(step.scene);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const frame = frameRef.current!;
    const screen = screenRef.current!;
    const pad = FRAME_PAD[device];
    const size = SCREEN_SIZE[device];
    const frameW = size.w + pad * 2;
    const frameH = size.h + pad * 2;

    let scale = 1;
    let visible: Rect = { x: 0, y: 0, w: size.w, h: size.h };
    const controller = new AbortController();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx: RunnerContext = {
      device,
      screen,
      pointer: pointerRef.current!,
      ripple: rippleRef.current!,
      highlight: highlightRef.current!,
      scale: () => scale,
      visible: () => visible,
      reduced,
      signal: controller.signal,
    };

    // The element the camera centres on when it zooms in.
    const focusName =
      step.highlight ??
      (step.gesture && "target" in step.gesture ? step.gesture.target : null);

    function layout() {
      const { width: cw, height: ch } = stage.getBoundingClientRect();
      if (!cw || !ch) return;
      const fit = Math.min(cw / frameW, ch / frameH) * 0.97;

      // Region of the frame to show, in frame coordinates.
      let region = { x: 0, y: 0, w: frameW, h: frameH };
      let s = fit;
      const focusEl =
        (focusName && findTarget(screen, focusName)) ||
        (step.gesture?.type === "drag-box" ? screen.querySelector<HTMLElement>('[data-part="snip-box"]') : null);

      const canZoom = zoom === "auto" && !SHOW_WHOLE_SCREEN.has(step.gesture?.type ?? "");
      if (canZoom && fit < MIN_READABLE_SCALE[device] && focusEl) {
        const t = boxOf({ screen, scale: () => scale }, focusEl);
        const aspect = ch / cw;
        let w =
          device === "iphone"
            ? frameW
            : Math.min(frameW, Math.max(t.w * 2.2, (t.h * 2.2) / aspect, MIN_ZOOM_WIDTH));
        let h = w * aspect;
        if (h > frameH) {
          h = frameH;
          w = h / aspect;
        }
        const cx = t.x + t.w / 2 + pad;
        const cy = t.y + t.h / 2 + pad;
        region = {
          x: Math.min(Math.max(cx - w / 2, 0), frameW - w),
          y: Math.min(Math.max(cy - h / 2, 0), frameH - h),
          w,
          h,
        };
        s = Math.min(cw / w, ch / h);
      }

      const tx = cw / 2 - (region.x + region.w / 2) * s;
      const ty = ch / 2 - (region.y + region.h / 2) * s;
      frame.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      frame.style.setProperty("--sc-inv", String(Math.max(1, 1 / s)));
      scale = s;
      visible = { x: region.x - pad, y: region.y - pad, w: region.w, h: region.h };
    }

    layout();
    prepareScene(ctx);
    layout();

    const observer = new ResizeObserver(() => {
      layout();
      refreshHighlight(ctx);
    });
    observer.observe(stage);
    // Marks the picture once its gesture has finished (used by tests).
    void playStep(ctx, step).then(() => {
      if (!controller.signal.aborted) stage.dataset.played = "true";
    });

    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [device, step, zoom]);

  return (
    <div ref={stageRef} className="sc-stage" style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden="true">
      <div ref={frameRef} className={`sc-frame is-${device}`}>
        <div ref={screenRef} className="sc-screen">
          <Scene scene={step.scene} />
          {device === "iphone" && <div className="ip-island" />}
          <div ref={highlightRef} className="sc-highlight" data-part="highlight" />
          <div ref={rippleRef} className="sc-ripple" />
          <div ref={pointerRef} className={`sc-pointer ${device === "iphone" ? "sc-finger" : "sc-cursor"}`}>
            {device === "windows" && <Art html={WIN_CURSOR} />}
          </div>
        </div>
      </div>
    </div>
  );
}
