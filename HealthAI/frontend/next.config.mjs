/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: "https://seng430-project-last-production.up.railway.app/api/:path*"
      }
    ]
  }
}

export default config
