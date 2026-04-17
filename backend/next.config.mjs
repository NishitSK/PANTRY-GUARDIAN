import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
    webpack(config) {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(process.cwd()),
        }

        return config
    },
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
}

export default nextConfig

