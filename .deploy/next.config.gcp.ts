import type { NextConfig } from 'next';

/**
 * Next.js configuration optimized for Google Cloud Platform deployment
 * Project: dulcet-nucleus-450804-a3
 */

const nextConfig: NextConfig = {
  // Output configuration for Cloud Run
  output: 'standalone',
  
  // Optimize for serverless
  compress: true,
  poweredByHeader: false,
  
  // Image optimization with GCS
  images: {
    domains: [
      'storage.googleapis.com',
      'dulcet-nucleus-450804-a3.storage.googleapis.com',
    ],
    loader: 'default',
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
  },
  
  // Environment variables
  env: {
    GCP_PROJECT_ID: 'dulcet-nucleus-450804-a3',
    GCP_LOCATION: 'us-central1',
    NEXT_PUBLIC_GCP_PROJECT: 'dulcet-nucleus-450804-a3',
  },
  
  // Experimental features for better performance
  experimental: {
    // Optimize for serverless
    serverMinification: true,
    
    // Optimize client bundles
    optimizeCss: true,
    
    // Better error handling
    serverSourceMaps: true,
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects for legacy endpoints
  async redirects() {
    return [
      {
        source: '/api/ai',
        destination: '/api/vertex-ai',
        permanent: true,
      },
      {
        source: '/api/voice',
        destination: '/api/google-voice',
        permanent: true,
      },
    ];
  },
  
  // Webpack configuration for GCP
  webpack: (config, { isServer }) => {
    // Optimize for Cloud Run
    if (isServer) {
      config.externals.push({
        '@google-cloud/aiplatform': 'commonjs @google-cloud/aiplatform',
        '@google-cloud/vertexai': 'commonjs @google-cloud/vertexai',
        '@google-cloud/speech': 'commonjs @google-cloud/speech',
        '@google-cloud/text-to-speech': 'commonjs @google-cloud/text-to-speech',
        '@google-cloud/translate': 'commonjs @google-cloud/translate',
      });
    }
    
    // Add aliases for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vertex-ai': '@/lib/vertex-ai-provider',
      '@google-speech': '@/lib/google-speech-provider',
    };
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Trailing slash configuration
  trailingSlash: false,
  
  // React strict mode for better debugging
  reactStrictMode: true,
  
  // SWC minification for better performance
  swcMinify: true,
};

export default nextConfig;
