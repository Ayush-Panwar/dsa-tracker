/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly exclude the extension directory from being processed by Next.js
  webpack: (config) => {
    // Add the extension directory to the list of ignored modules
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/extension/**']
    };
    return config;
  }
}

module.exports = nextConfig 
 
 
 