/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["socket.io-client"],
  images: { unoptimized: true },
  turbopack: {},
};

module.exports = nextConfig;
