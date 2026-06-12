import type { NextConfig } from "next";

// basePath and static export only apply when building for production.
// During `npm run dev` the app is served at localhost:3000/ without a prefix.
const isBuilding = process.env.npm_lifecycle_event === "build";

const nextConfig: NextConfig = {
  ...(isBuilding && { output: "export", basePath: "/learning" }),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
