import "./globals.css";
import 'reactflow/dist/style.css';

import type { Metadata } from 'next/types'
import localFont from "next/font/local";

import { Provider } from "@/components/provider";
import { Providers } from "@/providers";

const spaceMono = localFont({
  src: [
    {
      path: "../public/fonts/space-mono/SpaceMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/space-mono/SpaceMono-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/space-mono/SpaceMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/space-mono/SpaceMono-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  title: "Glean Family Tree",
  generator: "Next.js",
  applicationName: "Glean Family Tree",
  referrer: "origin-when-cross-origin",
  keywords: [
    "Family Tree",
    "Genealogy",
    "Next.js",
    "React",
    "Supabase",
    "ReactFlow",
    "Visualization",
  ],
  authors: [{ name: "zaob.ogn", url: "https://github.com/maemreyo" }],
  creator: "zaob.ogn",
  publisher: "zaob.ogn",
  alternates: {},
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://glean-family-tree-v2.vercel.app"),
  openGraph: {
    title: "Glean Family Tree",
    description: "A modern Family Tree application built with Next.js 15, Supabase, React Query, and ReactFlow.",
    url: "https://glean-family-tree-v2.vercel.app",
    siteName: "Glean Family Tree",
    images: [
      {
        url: "https://glean-family-tree-v2.vercel.app/og.png",
        width: 800,
        height: 600,
      },
      {
        url: "https://glean-family-tree-v2.vercel.app/og-dark.png",
        width: 1800,
        height: 1600,
        alt: "Glean Family Tree Application",
      },
    ],
    locale: "en-US",
    type: "website",
  },
  robots: {
    index: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceMono.className}`}>
        <Providers>
          <Provider attribute="class" defaultTheme="system" enableSystem>
            <main
              className={`bg-white text-zinc-700 dark:bg-black dark:text-zinc-400`}
            >
              {children}
            </main>
          </Provider>
        </Providers>
      </body>
    </html>
  );
}
