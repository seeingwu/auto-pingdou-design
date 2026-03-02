import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isElectron = process.env.BUILD_ELECTRON === "true";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || isElectron,
  register: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  output: isElectron ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {},
};

export default withPWA(nextConfig);
