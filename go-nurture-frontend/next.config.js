/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const origin = apiUrl.replace(/\/$/, '').replace(/\/api$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${origin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;