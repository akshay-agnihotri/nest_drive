/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this experimental block
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // Increase the limit to 100 MB (default is 1 MB)
    },
  },
};

export default nextConfig;
