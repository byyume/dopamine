import type { NextConfig } from "next";

// GitHub Pages 배포 시: DEPLOY_TARGET=gh-pages npm run build → out/ 정적 내보내기
const isGithubPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig: NextConfig = {
  ...(isGithubPages && {
    output: "export",
    basePath: "/dopamine",
    images: { unoptimized: true },
  }),
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
