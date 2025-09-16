/**
 * Compression Middleware for Crowe Logic Platform
 * Implements Brotli and Gzip compression for optimal performance
 */

import { NextRequest, NextResponse } from 'next/server';
import zlib from 'zlib';
import { promisify } from 'util';

const brotliCompress = promisify(zlib.brotliCompress);
const gzipCompress = promisify(zlib.gzip);

/**
 * Compression configuration
 */
export const compressionConfig = {
  // Minimum size in bytes to compress
  threshold: 1024, // 1KB
  
  // Compression levels (1-9 for gzip, 0-11 for brotli)
  level: {
    gzip: 6,
    brotli: 4
  },
  
  // MIME types to compress
  compressibleTypes: [
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/rss+xml',
    'application/atom+xml',
    'application/xhtml+xml',
    'application/x-font-ttf',
    'image/svg+xml',
    'font/opentype'
  ]
};

/**
 * Check if content type is compressible
 */
export function isCompressible(contentType: string | null): boolean {
  if (!contentType) return false;
  
  return compressionConfig.compressibleTypes.some(type => 
    contentType.includes(type)
  );
}

/**
 * Get accepted encoding from request
 */
export function getAcceptedEncoding(request: NextRequest): 'br' | 'gzip' | null {
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  if (acceptEncoding.includes('br')) {
    return 'br';
  }
  
  if (acceptEncoding.includes('gzip')) {
    return 'gzip';
  }
  
  return null;
}

/**
 * Compress response body
 */
export async function compressBody(
  body: string | Buffer,
  encoding: 'br' | 'gzip'
): Promise<Buffer> {
  const input = typeof body === 'string' ? Buffer.from(body) : body;
  
  if (encoding === 'br') {
    return brotliCompress(input, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: compressionConfig.level.brotli
      }
    });
  } else {
    return gzipCompress(input, {
      level: compressionConfig.level.gzip
    });
  }
}

/**
 * Compression middleware
 */
export async function compressionMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Get response from handler
  const response = await handler();
  
  // Check if compression is already applied
  if (response.headers.get('content-encoding')) {
    return response;
  }
  
  // Check if content type is compressible
  const contentType = response.headers.get('content-type');
  if (!isCompressible(contentType)) {
    return response;
  }
  
  // Get accepted encoding
  const encoding = getAcceptedEncoding(request);
  if (!encoding) {
    return response;
  }
  
  // Get response body
  const body = await response.text();
  
  // Check if body meets threshold
  if (body.length < compressionConfig.threshold) {
    return response;
  }
  
  try {
    // Compress body
    const compressed = await compressBody(body, encoding);
    
    // Calculate compression ratio
    const originalSize = Buffer.byteLength(body);
    const compressedSize = compressed.length;
    const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    // Return compressed response
    return new NextResponse(compressed as any, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'content-encoding': encoding,
        'content-length': compressedSize.toString(),
        'x-compression-ratio': `${ratio}%`,
        'vary': 'Accept-Encoding'
      }
    });
  } catch (error) {
    console.error('Compression error:', error);
    // Return original response on error
    return response;
  }
}

/**
 * Create compression middleware for specific routes
 */
export function createCompressionMiddleware(options?: {
  threshold?: number;
  level?: { gzip?: number; brotli?: number };
  types?: string[];
}) {
  const config = {
    ...compressionConfig,
    ...options,
    level: {
      ...compressionConfig.level,
      ...options?.level
    }
  };
  
  return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
    const response = await handler();
    
    // Apply custom configuration
    const originalConfig = { ...compressionConfig };
    Object.assign(compressionConfig, config);
    
    try {
      return await compressionMiddleware(request, async () => response);
    } finally {
      // Restore original configuration
      Object.assign(compressionConfig, originalConfig);
    }
  };
}

/**
 * Static asset compression with aggressive settings
 */
export const staticCompressionMiddleware = createCompressionMiddleware({
  threshold: 512, // Compress smaller files
  level: {
    gzip: 9,      // Maximum compression for static assets
    brotli: 11    // Maximum brotli compression
  }
});

/**
 * API response compression with balanced settings
 */
export const apiCompressionMiddleware = createCompressionMiddleware({
  threshold: 1024,
  level: {
    gzip: 6,      // Balanced compression
    brotli: 4     // Fast brotli compression
  }
});

/**
 * Get compression statistics
 */
export function getCompressionStats(
  originalSize: number,
  compressedSize: number
): {
  originalSize: string;
  compressedSize: string;
  saved: string;
  ratio: string;
} {
  const saved = originalSize - compressedSize;
  const ratio = (saved / originalSize * 100).toFixed(2);
  
  return {
    originalSize: formatBytes(originalSize),
    compressedSize: formatBytes(compressedSize),
    saved: formatBytes(saved),
    ratio: `${ratio}%`
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
