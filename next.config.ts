import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  async redirects(){
    return ['/', '/login', '/leaderboard/:path*', '/profile'].map(source=>({
      source,
      has:[{type:'host' as const,value:'bond-lab-hkdse-longs-projects-0240e8f8.vercel.app'}],
      destination:'https://bond-lab-hkdse.vercel.app'+source,
      permanent:false,
    }));
  },
};
export default config;
