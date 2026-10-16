import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { showDrafts } from "@/lib/walkthroughs";

// Phase 1 placeholder: confirms the app is running and the library seeded.
// Phase 3 replaces this with the real home screen (text box, Speak, topics).
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Tech Walkthrough</h1>
      <p className="mt-2 text-ink-soft">Foundation check: walkthroughs loaded from the library.</p>
      <Suspense fallback={<p className="mt-6">Loading…</p>}>
        <LibraryList />
      </Suspense>
    </main>
  );
}

async function LibraryList() {
  let walkthroughs;
  try {
    walkthroughs = await prisma.walkthrough.findMany({
      where: { organizationId: null, ...(showDrafts() ? {} : { status: "published" as const }) },
      orderBy: [{ device: "asc" }, { title: "asc" }],
      select: { slug: true, title: true, device: true, status: true, _count: { select: { steps: true } } },
    });
  } catch {
    return <p className="mt-6">That didn&apos;t work. The database isn&apos;t reachable yet.</p>;
  }

  if (walkthroughs.length === 0) {
    return <p className="mt-6">No walkthroughs yet. Run the seed script to load the library.</p>;
  }

  return (
    <ul className="mt-6 divide-y divide-line border-y border-line">
      {walkthroughs.map((w) => (
        <li key={w.slug}>
          <Link href={`/w/${w.slug}`} className="block py-4 hover:bg-surface focus-visible:outline-4 focus-visible:outline-highlight">
            <span className="block text-lg font-semibold text-action underline">{w.title}</span>
            <span className="block text-ink-soft">
              {w.device === "iphone" ? "iPhone" : "Windows"} · {w._count.steps} steps · {w.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
