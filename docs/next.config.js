const withMDX = require('@next/mdx')({
  extension: /.mdx?$/,
  options: {
    remarkPlugins: [require('remark-gfm')],
    rehypePlugins: [require('rehype-slug'), require('rehype-autolink-headings')],
    providerImportSource: '@mdx-js/react'
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    mdxRs: false,
  },
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production'
  },
  // Support for static export
  trailingSlash: true,
  output: process.env.BUILD_MODE === 'export' ? 'export' : undefined,
  distDir: 'build',
  // Environment variables
  env: {
    NEXT_PUBLIC_DOCS_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_APP_URL: process.env.APP_URL || 'https://sentia-manufacturing.railway.app',
  },
  // Redirects for legacy URLs
  async redirects() {
    return [
      {
        source: '/user-guide',
        destination: '/guides/viewer-guide',
        permanent: true,
      },
      {
        source: '/api-docs',
        destination: '/developer/api-reference',
        permanent: true,
      },
    ];
  },
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withMDX(nextConfig);