import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Player } from "@/components/player/Player";
import { getWalkthroughForPlayer } from "@/lib/walkthroughs";

export default function WalkthroughPage({ params }: PageProps<"/w/[slug]">) {
  return (
    <Suspense fallback={<p className="p-6 text-lg">Loading your steps…</p>}>
      <WalkthroughLoader params={params} />
    </Suspense>
  );
}

async function WalkthroughLoader({ params }: Pick<PageProps<"/w/[slug]">, "params">) {
  const { slug } = await params;
  const walkthrough = await getWalkthroughForPlayer(slug);
  if (!walkthrough) notFound();

  return (
    <>
      <title>{`${walkthrough.title} · Tech Walkthrough`}</title>
      <Player walkthrough={walkthrough} />
    </>
  );
}
