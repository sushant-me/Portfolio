import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // `experimental.inlineCss` was measured here and reverted: three live runs gave a
  // median performance of 71 (unchanged) but a median LCP of 3.23 s against 2.88 s,
  // and a median element render delay of 745 ms against 699 ms, while the document
  // grew 28.4 KB → 33.1 KB. The CSS round trip it removed was not the bottleneck it
  // looked like. Left as a note so the experiment is not repeated blind.
};

export default nextConfig;