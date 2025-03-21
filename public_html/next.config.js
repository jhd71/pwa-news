/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration pour les API
  async redirects() {
    return [
      {
        source: '/api/sendPush',
        destination: '/pages/api/sendPush.js',
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;