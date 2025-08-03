/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this experimental block
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Increase the limit to 50 MB
    },
  },
};

export default nextConfig;
