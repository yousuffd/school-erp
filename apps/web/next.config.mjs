/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bundles only what's actually needed to run into .next/standalone —
  // self-contained server output built specifically for containers, instead
  // of shipping the full node_modules tree.
  output: 'standalone',
};
export default nextConfig;
