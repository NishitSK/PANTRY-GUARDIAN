/** @type {import('next').NextConfig} */
const backendApiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

if (process.env.VERCEL && !backendApiBase) {
    throw new Error('NEXT_PUBLIC_API_URL is required for the frontend Vercel deployment.')
}

const nextConfig = {
	reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'images.pexels.com',
            },
            {
                protocol: 'https',
                hostname: 'me7aitdbxq.ufs.sh',
            }
        ],
    },
    async rewrites() {
        if (!backendApiBase) {
            return []
        }

        return [
            {
                source: '/api/:path*',
                destination: `${backendApiBase}/api/:path*`,
            },
        ]
    },
}

export default nextConfig

