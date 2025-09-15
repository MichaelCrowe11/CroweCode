// src/app/api/files/route.ts - Secured file operations API
export const runtime = 'nodejs'; // Required for file system operations

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { 
  safeReadFile, 
  safeWriteFile, 
  safeListDirectory, 
  getFileTree,
  validateFileOperation,
  FileSystemError 
} from '@/lib/safe-fs';

/**
 * GET /api/files - List files or read file content
 * Query params:
 * - action: 'tree' | 'list' | 'read'
 * - path: relative path (optional)
 */
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action') || 'tree';
    const path = searchParams.get('path') || '';

    // Validate operation permissions
    if (!validateFileOperation('read', req.user.role, path)) {
      return NextResponse.json(
        { 
          error: 'Permission denied',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Role '${req.user.role}' cannot read files at '${path}'`
        },
        { status: 403 }
      );
    }

    switch (action) {
      case 'tree': {
        const tree = await getFileTree(path);
        return NextResponse.json({ 
          tree, 
          path,
          user: { role: req.user.role }
        });
      }

      case 'list': {
        const listing = await safeListDirectory(path);
        return NextResponse.json(listing);
      }

      case 'read': {
        if (!path) {
          return NextResponse.json(
            { error: 'Path parameter required for read operation' },
            { status: 400 }
          );
        }

        const file = await safeReadFile(path);
        return NextResponse.json(file);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: tree, list, read' },
          { status: 400 }
        );
    }

  } catch (error) {
    if (error instanceof FileSystemError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code
        },
        { status: statusCode }
      );
    }

    console.error('File API GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/files - Write, create, or delete files
 * Body:
 * - action: 'write' | 'create' | 'delete'
 * - path: relative path
 * - content: file content (for write/create)
 */
export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { action, path, content } = body;

    if (!action || !path) {
      return NextResponse.json(
        { error: 'Action and path are required' },
        { status: 400 }
      );
    }

    // Validate operation permissions
    const isWriteOperation = ['write', 'create'].includes(action);
    const operationType = isWriteOperation ? 'write' : 'read';
    
    if (!validateFileOperation(operationType, req.user.role, path)) {
      return NextResponse.json(
        { 
          error: 'Permission denied',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Role '${req.user.role}' cannot ${action} files at '${path}'`
        },
        { status: 403 }
      );
    }

    switch (action) {
      case 'write':
      case 'create': {
        if (typeof content !== 'string') {
          return NextResponse.json(
            { error: 'Content must be a string' },
            { status: 400 }
          );
        }

        const result = await safeWriteFile(path, content);
        return NextResponse.json({
          success: true,
          message: `File ${action === 'create' ? 'created' : 'written'} successfully`,
          ...result
        });
      }

      case 'delete': {
        // For now, we'll disable delete operations for security
        // In production, this would need additional safeguards
        return NextResponse.json(
          { 
            error: 'Delete operations are currently disabled for security',
            code: 'OPERATION_DISABLED'
          },
          { status: 403 }
        );
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: write, create' },
          { status: 400 }
        );
    }

  } catch (error) {
    if (error instanceof FileSystemError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code
        },
        { status: statusCode }
      );
    }

    console.error('File API POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}, {
  requiredRole: 'USER', // Minimum role required
  requireEmailVerified: true // Require verified email for file operations
});

/**
 * Map FileSystemError codes to HTTP status codes
 */
function getStatusCodeForError(code: string): number {
  switch (code) {
    case 'INVALID_PATH':
    case 'INVALID_EXTENSION':
    case 'INVALID_CONTENT':
      return 400; // Bad Request
    
    case 'PERMISSION_DENIED':
    case 'FORBIDDEN_PATH':
      return 403; // Forbidden
    
    case 'FILE_NOT_FOUND':
    case 'DIRECTORY_NOT_FOUND':
      return 404; // Not Found
    
    case 'PATH_TRAVERSAL':
    case 'SUSPICIOUS_CONTENT':
      return 400; // Bad Request (security)
    
    case 'FILE_TOO_LARGE':
    case 'CONTENT_TOO_LARGE':
    case 'PATH_TOO_LONG':
      return 413; // Payload Too Large
    
    case 'NO_SPACE':
      return 507; // Insufficient Storage
    
    default:
      return 500; // Internal Server Error
  }
}