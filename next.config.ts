import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.178.103",
    "192.168.178.103:3001",
    "localhost",
    "localhost:3001",
    "127.0.0.1",
    "127.0.0.1:3001",
  ],
};

export default nextConfig;
