"use client";

// The staff walkthrough player: one step per screen with a drawn, animated
// picture, one short instruction, big Back / Next buttons, and the
// "Did this solve it?" ending.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Gesture, Scene } from "@/scenes/format";
import { SceneView } from "@/scenes/SceneView";
import "./player.css";

export type PlayerStep = {
  text: string;
  alt: string;
  scene: Scene | null;
  gesture: Gesture | null;
  highlight: string | null;
};

export type PlayerWalkthrough = {
  title: string;
  status: "draft" | "published";
  bonusTip: string | null;
  steps: PlayerStep[];
};

type Answer = null | "yes" | "no";

const noSubscribe = () => () => {};

export function Player({ walkthrough }: { walkthrough: PlayerWalkthrough }) {
  const { steps } = walkthrough;
  const [index, setIndex] = useState(0);
  const [replay, setReplay] = useState(0);
  const [done, setDone] = useState(false);
  const [answer, setAnswer] = useState<Answer>(null);
  const [asked, setAsked] = useState(false);
  const [big, setBig] = useState(false);
  const [speechFailed, setSpeechFailed] = useState(false);

  const nextRef = useRef<HTMLButtonElement>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLButtonElement>(null); // the "Make picture bigger" button
  const closeRef = useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const total = steps.length;
  const isLast = index === total - 1;

  // Read-aloud uses the browser's own voice; the button only shows where one exists.
  const hasVoice = useSyncExternalStore(
    noSubscribe,
    () => "speechSynthesis" in window,
    () => false,
  );
  const canSpeak = hasVoice && !speechFailed;

  const goTo = useCallback((i: number) => {
    window.speechSynthesis?.cancel();
    setIndex(i);
    setReplay(0);
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      window.speechSynthesis?.cancel();
      setDone(true);
      setAnswer(null);
      setAsked(false);
    } else {
      goTo(index + 1);
    }
  }, [goTo, index, isLast]);

  const back = useCallback(() => {
    if (index > 0) goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    if (done) doneHeadingRef.current?.focus();
  }, [done]);

  useEffect(() => {
    if (big) closeRef.current?.focus();
  }, [big]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (big) {
        if (e.key === "Escape") closeBig();
        return;
      }
      if (done) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function closeBig() {
    setBig(false);
    requestAnimationFrame(() => stageRef.current?.focus());
  }

  function speak() {
    try {
      const text = done ? "Did this solve it?" : `Step ${index + 1} of ${total}. ${step.text}`;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch {
      setSpeechFailed(true);
    }
  }

  function restart(at: number) {
    setDone(false);
    goTo(at);
    requestAnimationFrame(() => nextRef.current?.focus());
  }

  const progress = done ? 100 : ((index + 1) / total) * 100;
  const sceneStep = step.scene ? { scene: step.scene, gesture: step.gesture, highlight: step.highlight } : null;

  return (
    <>
      <main className={`pl${done ? " is-done" : ""}`} inert={big}>
        <header className="pl-head">
          <div className="pl-meta">
            <p className="pl-task">{walkthrough.title}</p>
            <p className="pl-count">{done ? "All steps done" : `Step ${index + 1} of ${total}`}</p>
          </div>
          {canSpeak && (
            <button type="button" className="pl-btn pl-speak" onClick={speak}>
              {done ? "Read this aloud" : "Read this step aloud"}
            </button>
          )}
          <div className="pl-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          {walkthrough.status === "draft" && (
            <p className="pl-draft">Draft: these steps have not been checked on a real device yet.</p>
          )}
        </header>

        {!done && (
          <>
            <div className="pl-side">
              <p className="pl-words">{step.text}</p>
              <nav className="pl-nav" aria-label="Steps">
                <button type="button" className="pl-btn" onClick={back} disabled={index === 0}>
                  <span aria-hidden="true">←</span> Back
                </button>
                <button type="button" className="pl-btn is-primary" onClick={next} ref={nextRef}>
                  {isLast ? "Finish" : "Next"} <span aria-hidden="true">→</span>
                </button>
              </nav>
            </div>

            {sceneStep ? (
              <div className="pl-stage">
                {/* Tapping anywhere on the picture opens it big; keyboard and
                    screen reader users get the real button below it. */}
                <div className="pl-picture" role="img" aria-label={step.alt} onClick={() => setBig(true)}>
                  {!big && <SceneView key={`${index}-${replay}`} step={sceneStep} />}
                </div>
                <div className="pl-picture-bar">
                  <button type="button" className="pl-btn pl-small" onClick={() => setReplay((r) => r + 1)}>
                    Show me again
                  </button>
                  <button type="button" className="pl-btn pl-small" ref={stageRef} onClick={() => setBig(true)}>
                    Make picture bigger
                  </button>
                </div>
              </div>
            ) : (
              <div className="pl-stage is-empty">
                <p>There is no picture for this step.</p>
              </div>
            )}
          </>
        )}

        {done && (
          <section className="pl-done" aria-labelledby="pl-done-q">
            <h2 id="pl-done-q" tabIndex={-1} ref={doneHeadingRef}>
              Did this solve it?
            </h2>
            {answer === null && (
              <div className="pl-stack">
                <button type="button" className="pl-btn is-primary" onClick={() => setAnswer("yes")}>
                  Yes, it worked
                </button>
                <button type="button" className="pl-btn" onClick={() => setAnswer("no")}>
                  No, I still need help
                </button>
              </div>
            )}
            {answer === "yes" && <p className="pl-result is-good">Great work. You did it.</p>}
            {answer === "no" && (
              <div className="pl-stack">
                <p className="pl-result">That&apos;s okay. Someone can help you.</p>
                <button type="button" className="pl-btn is-primary" onClick={() => setAsked(true)}>
                  Ask someone for help
                </button>
                {asked && (
                  <p className="pl-plain" role="status">
                    Sending your question to your IT contact is not set up yet. Please ask them in person for now.
                  </p>
                )}
              </div>
            )}
            {walkthrough.bonusTip && (
              <aside className="pl-tip">
                <h3>Extra tip</h3>
                <p>{walkthrough.bonusTip}</p>
              </aside>
            )}
            <div className="pl-stack">
              <button type="button" className="pl-btn" onClick={() => restart(total - 1)}>
                Go back to the steps
              </button>
              <button type="button" className="pl-btn" onClick={() => restart(0)}>
                Start over
              </button>
            </div>
          </section>
        )}

        <p className="pl-sr" aria-live="polite">
          {done ? "All steps done. Did this solve it?" : `Step ${index + 1} of ${total}. ${step.text}`}
        </p>
      </main>

      {big && sceneStep && (
        <div className="pl-big" role="dialog" aria-modal="true" aria-label="Big picture">
          <div className="pl-big-bar">
            <p className="pl-count">{`Step ${index + 1} of ${total}`}</p>
            <button type="button" className="pl-btn is-primary" ref={closeRef} onClick={closeBig}>
              Close big picture
            </button>
          </div>
          <div className="pl-big-stage" role="img" aria-label={step.alt}>
            <SceneView key={`big-${index}`} step={sceneStep} zoom="whole" />
          </div>
        </div>
      )}
    </>
  );
}
