/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SOCKET_IO_URL: process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
