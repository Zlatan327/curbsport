/** @type {import('next').NextConfig} */
const exportForBuild = process.env.CURBSPORT_STATIC_EXPORT === "1" || process.env.NODE_ENV === "production";
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  ...(exportForBuild ? { output: "export", trailingSlash: true } : {}),
};

export default nextConfig;
