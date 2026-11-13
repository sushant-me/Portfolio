import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    // Measured experiment: inline each route's CSS into its HTML instead of emitting
    // a render-blocking stylesheet request. The stylesheet is tiny (~4 KB) but it is
    // discovered only after the document parses and was arriving ~500 ms after the
    // HTML on a throttled connection, which is directly in front of first paint — and
    // therefore of the LCP text paint. Revert if the live Lighthouse median gets
    // worse; the cost is a larger document.
    inlineCss: true,
  },
};

export default nextConfig;