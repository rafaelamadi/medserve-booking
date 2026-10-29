import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: false,
      },
      {
        source: "/hub",
        destination: "/dashboard/default",
        permanent: false,
      },
      {
        source: "/hub/appointments",
        destination: "/dashboard/appointments",
        permanent: false,
      },
      {
        source: "/hub/series",
        destination: "/dashboard/appointments",
        permanent: false,
      },
      {
        source: "/dashboard/series",
        destination: "/dashboard/appointments",
        permanent: false,
      },
      {
        source: "/hub/patients",
        destination: "/dashboard/patients",
        permanent: false,
      },
      {
        source: "/hub/reschedules",
        destination: "/dashboard/reschedules",
        permanent: false,
      },
      {
        source: "/hub/results",
        destination: "/dashboard/results",
        permanent: false,
      },
      {
        source: "/hub/reports",
        destination: "/dashboard/reports",
        permanent: false,
      },
      {
        source: "/hub/settings/:path*",
        destination: "/dashboard/settings/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
