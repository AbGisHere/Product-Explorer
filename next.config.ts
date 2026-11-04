import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Cache Components is deliberately OFF (create-next-app 16.4 enables it).
   * We use the classic Data Cache instead: fetch(..., { next: { revalidate, tags } })
   * + updateTag(). It's explicit per request and easy to prove with origin logs.
   * See README "Caching".
   */
  cacheComponents: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com", pathname: "/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
