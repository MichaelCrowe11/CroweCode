// src/lib/safe-fs.ts - Secure file system operations
import { resolve, dirname, extname, normalize, sep } from 'node:path';
import { stat, readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Configuration
const BASE_DIR = process.env.CROWE_WORKSPACE_DIR || process.cwd();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PATH_LENGTH = 260; // Windows compatibility

// Allowed file extensions for different operations
const ALLOWED_READ_EXTENSIONS = new Set([
  // Source code
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.java', '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp',
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala',
  '.dart', '.lua', '.pl', '.r', '.m', '.mm',
  
  // Web technologies
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.vue', '.svelte', '.astro',
  
  // Configuration & data
  '.json', '.yaml', '.yml', '.toml', '.ini', '.conf',
  '.env', '.properties', '.xml', '.csv',
  
  // Documentation
  '.md', '.mdx', '.rst', '.txt', '.adoc',
  
  // Database & queries
  '.sql', '.prisma', '.graphql', '.gql',
  
  // Build & tooling
  '.dockerfile', '.gitignore', '.gitattributes',
  '.eslintrc', '.prettierrc', '.editorconfig',
]);

const ALLOWED_WRITE_EXTENSIONS = new Set([
  // More restrictive for writes - only common development files
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java',
  '.html', '.css', '.json', '.md', '.txt',
  '.yml', '.yaml', '.env', '.gitignore',
  '.sql', '.prisma'
]);

const FORBIDDEN_PATHS = new Set([
  // System directories
  'node_modules', '.git', '.next', 'dist', 'build',
  // Sensitive files
  '.env.local', '.env.production', 'package-lock.json',
  // Binary directories
  'bin', 'obj', 'target', '__pycache__'
]);

export class FileSystemError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

/**
 * Safely resolve a file path, preventing directory traversal
 */
export async function safeResolve(relativePath: string, operation: 'read' | 'write' = 'read'): Promise<string> {
  // Input validation
  if (!relativePath || typeof relativePath !== 'string') {
    throw new FileSystemError('Invalid path provided', 'INVALID_PATH');
  }

  if (relativePath.length > MAX_PATH_LENGTH) {
    throw new FileSystemError('Path too long', 'PATH_TOO_LONG');
  }

  // Normalize and resolve path
  const normalizedPath = normalize(relativePath.replace(/\\/g, '/'));
  const resolvedBase = resolve(BASE_DIR);
  const resolvedPath = resolve(resolvedBase, normalizedPath);

  // Ensure path is within allowed directory
  if (!resolvedPath.startsWith(resolvedBase + sep)) {
    throw new FileSystemError('Path traversal detected', 'PATH_TRAVERSAL');
  }

  // Check for forbidden path segments
  const pathSegments = normalizedPath.split('/');
  for (const segment of pathSegments) {
    if (FORBIDDEN_PATHS.has(segment)) {
      throw new FileSystemError(`Access to '${segment}' is forbidden`, 'FORBIDDEN_PATH');
    }
  }

  // Validate file extension
  const ext = extname(resolvedPath).toLowerCase();
  const allowedExtensions = operation === 'write' ? ALLOWED_WRITE_EXTENSIONS : ALLOWED_READ_EXTENSIONS;
  
  if (ext && !allowedExtensions.has(ext)) {
    throw new FileSystemError(`File type '${ext}' not allowed for ${operation}`, 'INVALID_EXTENSION');
  }

  return resolvedPath;
}

/**
 * Safely read a file with size and content validation
 */
export async function safeReadFile(relativePath: string): Promise<{ path: string; content: string; size: number }> {
  const fullPath = await safeResolve(relativePath, 'read');

  try {
    // Check if file exists and get stats
    const stats = await stat(fullPath);

    if (!stats.isFile()) {
      throw new FileSystemError('Path is not a file', 'NOT_A_FILE');
    }

    if (stats.size > MAX_FILE_SIZE) {
      throw new FileSystemError(`File too large (${stats.size} bytes, max ${MAX_FILE_SIZE})`, 'FILE_TOO_LARGE');
    }

    // Read file content
    const content = await readFile(fullPath, 'utf-8');

    // Basic content validation - check for binary content
    if (content.includes('\0')) {
      throw new FileSystemError('Binary files are not supported', 'BINARY_FILE');
    }

    return {
      path: relativePath,
      content,
      size: stats.size
    };

  } catch (error: any) {
    if (error instanceof FileSystemError) {
      throw error;
    }

    if (error.code === 'ENOENT') {
      throw new FileSystemError('File not found', 'FILE_NOT_FOUND');
    }

    if (error.code === 'EACCES') {
      throw new FileSystemError('Permission denied', 'PERMISSION_DENIED');
    }

    throw new FileSystemError(`File system error: ${error.message}`, 'FS_ERROR');
  }
}

/**
 * Safely write a file with validation
 */
export async function safeWriteFile(relativePath: string, content: string): Promise<{ path: string; size: number }> {
  const fullPath = await safeResolve(relativePath, 'write');

  // Validate content
  if (typeof content !== 'string') {
    throw new FileSystemError('Content must be a string', 'INVALID_CONTENT');
  }

  if (Buffer.byteLength(content, 'utf8') > MAX_FILE_SIZE) {
    throw new FileSystemError('Content too large', 'CONTENT_TOO_LARGE');
  }

  // Check for suspicious content patterns
  const suspiciousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript URLs
    /on\w+\s*=/gi, // Event handlers
    /eval\s*\(/gi, // Eval functions
    /Function\s*\(/gi, // Function constructor
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      throw new FileSystemError('Suspicious content detected', 'SUSPICIOUS_CONTENT');
    }
  }

  try {
    // Ensure directory exists
    const dirPath = dirname(fullPath);
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    // Write file
    await writeFile(fullPath, content, 'utf-8');
    
    const stats = await stat(fullPath);
    
    return {
      path: relativePath,
      size: stats.size
    };

  } catch (error: any) {
    if (error instanceof FileSystemError) {
      throw error;
    }

    if (error.code === 'EACCES') {
      throw new FileSystemError('Permission denied', 'PERMISSION_DENIED');
    }

    if (error.code === 'ENOSPC') {
      throw new FileSystemError('No space left on device', 'NO_SPACE');
    }

    throw new FileSystemError(`File system error: ${error.message}`, 'FS_ERROR');
  }
}

/**
 * Safely list directory contents
 */
export async function safeListDirectory(relativePath: string = ''): Promise<{
  files: Array<{ name: string; type: 'file' | 'directory'; size?: number }>;
  path: string;
}> {
  const fullPath = await safeResolve(relativePath || '.', 'read');

  try {
    const stats = await stat(fullPath);
    
    if (!stats.isDirectory()) {
      throw new FileSystemError('Path is not a directory', 'NOT_A_DIRECTORY');
    }

    const items = await readdir(fullPath, { withFileTypes: true });
    const files = [];

    for (const item of items) {
      // Skip forbidden items
      if (FORBIDDEN_PATHS.has(item.name) || item.name.startsWith('.')) {
        continue;
      }

      try {
        const itemPath = resolve(fullPath, item.name);
        const itemStats = await stat(itemPath);

        files.push({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          size: item.isFile() ? itemStats.size : undefined
        });
      } catch {
        // Skip items we can't read
        continue;
      }
    }

    return {
      files: files.sort((a, b) => {
        // Directories first, then alphabetical
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }),
      path: relativePath
    };

  } catch (error: any) {
    if (error instanceof FileSystemError) {
      throw error;
    }

    if (error.code === 'ENOENT') {
      throw new FileSystemError('Directory not found', 'DIRECTORY_NOT_FOUND');
    }

    if (error.code === 'EACCES') {
      throw new FileSystemError('Permission denied', 'PERMISSION_DENIED');
    }

    throw new FileSystemError(`File system error: ${error.message}`, 'FS_ERROR');
  }
}

/**
 * Get file tree structure (for file explorer)
 */
export async function getFileTree(relativePath: string = '', maxDepth: number = 3): Promise<any[]> {
  if (maxDepth <= 0) return [];
  
  try {
    const { files } = await safeListDirectory(relativePath);
    const tree = [];

    for (const file of files.slice(0, 100)) { // Limit to prevent DoS
      if (file.type === 'directory') {
        try {
          const children = await getFileTree(
            relativePath ? `${relativePath}/${file.name}` : file.name,
            maxDepth - 1
          );
          tree.push({
            name: file.name,
            type: 'folder',
            children
          });
        } catch {
          // Skip directories we can't read
          tree.push({
            name: file.name,
            type: 'folder',
            children: []
          });
        }
      } else {
        // Only include allowed file types
        const ext = extname(file.name).toLowerCase();
        if (ALLOWED_READ_EXTENSIONS.has(ext) || !ext) {
          tree.push({
            name: file.name,
            type: 'file',
            size: file.size
          });
        }
      }
    }

    return tree;
  } catch (error) {
    console.warn('Error building file tree:', error);
    return [];
  }
}

/**
 * Validate file operation permissions
 */
export function validateFileOperation(operation: 'read' | 'write', userRole: string, filePath: string): boolean {
  // Admin can do everything
  if (userRole === 'ADMIN') return true;

  // Manager can read/write most files
  if (userRole === 'MANAGER') {
    // Restrict access to sensitive config files
    const sensitivePatterns = [/\.env/, /config/, /secret/];
    return !sensitivePatterns.some(pattern => pattern.test(filePath.toLowerCase()));
  }

  // Operator can read most files, limited write
  if (userRole === 'OPERATOR') {
    if (operation === 'write') {
      // Only allow writing to specific directories
      const allowedWritePaths = ['/src/', '/docs/', '/tests/'];
      return allowedWritePaths.some(path => filePath.includes(path));
    }
    return true; // Can read most files
  }

  // User has limited access
  if (userRole === 'USER') {
    if (operation === 'write') {
      // Very limited write access
      const userWritePaths = ['/src/components/', '/docs/'];
      return userWritePaths.some(path => filePath.includes(path));
    }
    
    // Limited read access
    const restrictedPatterns = [/\.env/, /config/, /secret/, /auth/];
    return !restrictedPatterns.some(pattern => pattern.test(filePath.toLowerCase()));
  }

  // Viewer can only read public files
  if (userRole === 'VIEWER') {
    if (operation === 'write') return false;
    
    const publicPaths = ['/docs/', '/public/', '/README'];
    return publicPaths.some(path => filePath.includes(path));
  }

  return false;
}