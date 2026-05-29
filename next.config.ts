import type { NextConfig } from "next";

// Apply static export only when running `npm run build`.
// During `npm run dev` dynamic routes are rendered on demand.
const isBuilding = process.env.npm_lifecycle_event === "build";

const nextConfig: NextConfig = {
  ...(isBuilding && { output: "export" }),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
