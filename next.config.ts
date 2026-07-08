import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // next/image requires every remote image hostname to be explicitly
    // whitelisted. Supabase Storage (profile photos, National ID uploads,
    // any other user-uploaded image) is served from this project's own
    // storage subdomain — without this, next/image throws rather than
    // silently allowing arbitrary hosts, which is the correct default
    // but needs this one entry for our own storage to work at all.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mccnfmzfmnhqjatuxnvg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
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
      static: 30,
    },
  },
};

export default nextConfig;
