import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import { Header } from "@/components/Header";
import { Room } from "@/components/glass/Room";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import { version } from "../../package.json";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Product Explorer", template: "%s · Product Explorer" },
  description: "Browse, search and save products from the DummyJSON catalogue.",
};

// The shell (header + main landmark) lives in the root layout, so it's kept
// on screen while route segments below it load or error.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme before React hydrates.
    <html lang="en" className={`${archivo.variable} ${hanken.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <Room>
          <Header />
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-10 sm:px-6">
            {children}
          </main>
        </Room>
        <footer>
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted sm:px-6">
            <span>
              Product data from{" "}
              <a href="https://dummyjson.com/docs/products" className="underline hover:text-ink">
                DummyJSON
              </a>
            </span>
            <span className="tabular-nums">v{version}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
