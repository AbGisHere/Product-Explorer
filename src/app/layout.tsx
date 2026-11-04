import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { version } from "../../package.json";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Product Explorer", template: "%s · Product Explorer" },
  description: "Browse, search and save products from the DummyJSON catalogue.",
};

// The shell (header + main landmark) lives in the root layout, so it's kept
// on screen while route segments below it load or error.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          Product data from{" "}
          <a href="https://dummyjson.com/docs/products" className="underline hover:text-accent">
            DummyJSON
          </a>{" "}
          · v{version}
        </footer>
      </body>
    </html>
  );
}
