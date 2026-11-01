import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp loads libvips from a native .so that file tracing misses on Vercel; ship it with every function.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@img/sharp-libvips-linux-x64/**/*", "./node_modules/@img/sharp-linux-x64/**/*"],
  },
};

export default nextConfig;
