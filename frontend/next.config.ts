import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/admin/imports', destination: '/admin/staged-changes', permanent: true },
      { source: '/admin/data-sources', destination: '/admin/cricos', permanent: true },
      { source: '/admin/sync', destination: '/admin/cricos/runs', permanent: true },
      { source: '/admin/analytics/native', destination: '/admin', permanent: true },
      { source: '/admin/ingestion-jobs', destination: '/admin/staged-changes', permanent: true },
      { source: '/admin/provider-sync', destination: '/admin/cricos/provider-sync', permanent: true },
    ];
  },
};

export default nextConfig;
