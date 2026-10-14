import type { Metadata, Viewport } from "next";
import "./globals.css";

// Product name is still an open question; "Tech Walkthrough" is a placeholder.
export const metadata: Metadata = {
  title: "Tech Walkthrough",
  description: "Step-by-step help for common iPhone and Windows tasks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
