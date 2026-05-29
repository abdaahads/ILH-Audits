import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Allow external images from ILH website and Supabase storage */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ivyleaguehouse.com",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
