import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Forces every client-side navigation to refetch fresh RSC payloads
    // instead of replaying Next.js's client Router Cache. Without this,
    // a route that was ever cached while logged out (e.g. a protected
    // page redirecting to /login before you'd signed in) can keep being
    // served from that stale cache even after auth state changes —
    // which is what was causing "/" to intermittently show /login's
    // cached response instead of navigating fresh.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
