import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-4">The help you were looking for isn&apos;t here. Let&apos;s go back and try again.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-16 items-center rounded-2xl bg-action px-6 text-lg font-bold text-action-ink"
      >
        Go back to the start
      </Link>
    </main>
  );
}
