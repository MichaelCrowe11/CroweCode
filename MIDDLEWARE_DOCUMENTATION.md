# CroweCode Platform - Middleware Documentation

## Overview
The middleware system provides comprehensive security, authentication, and request validation for the CroweCode Platform.

## Features

### 1. JWT Authentication
- Edge runtime compatible JWT verification using `jose` library
- Token extraction from Authorization header or cookies
- Protected routes require valid JWT tokens
- Public routes bypass authentication

### 2. Security Headers
- **Content Security Policy (CSP)**: Restricts resource loading to trusted sources
- **X-Frame-Options**: Prevents clickjacking attacks (DENY)
- **X-Content-Type-Options**: Prevents MIME type sniffing (nosniff)
- **Referrer-Policy**: Controls referrer information (strict-origin-when-cross-origin)
- **Permissions-Policy**: Restricts browser features access

### 3. Rate Limiting
- IP-based rate limiting with configurable limits
- Default: 100 requests per minute per IP
- Automatic cleanup of expired entries
- Returns 429 status when limit exceeded

### 4. CORS Configuration
- Configurable allowed origins via `ALLOWED_ORIGINS` environment variable
- Supports credentials and preflight requests
- Default allows localhost origins in development

## Configuration

### Environment Variables
```env
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://example.com,https://app.example.com
RATE_LIMIT=100  # requests per minute (optional)
```

### Public Routes
Routes that don't require authentication:

**API Routes:**
- `/api/health` - Health check endpoint
- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/refresh` - Token refresh
- `/api/public/*` - Public API endpoints

**Pages:**
- `/` - Homepage
- `/login` - Login page
- `/register` - Registration page
- `/about` - About page
- `/pricing` - Pricing page
- `/docs` - Documentation

## Usage Examples

### Protected API Route
```typescript
// This route requires authentication
// Middleware automatically validates JWT
export async function GET(request: Request) {
  // User info available in request headers
  const userId = request.headers.get('x-user-id');
  // ... handle request
}
```

### Public API Route
```typescript
// Route path: /api/public/stats
// No authentication required
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

## Security Features

### Rate Limiting Implementation
- Tracks requests per IP address
- Sliding window of 1 minute
- Automatically cleans up expired entries
- Returns `429 Too Many Requests` when exceeded

### CORS Handling
- Validates origin against allowed list
- Handles preflight OPTIONS requests
- Includes credentials support

### Request Validation
- Validates JWT expiration
- Checks token signature
- Extracts user information for downstream use

## Error Responses

| Status Code | Description |
|------------|-------------|
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Valid token but insufficient permissions |
| 429 | Too Many Requests - Rate limit exceeded |

## Performance Considerations
- Edge runtime compatible for optimal performance
- Minimal dependencies for fast cold starts
- Efficient in-memory rate limiting
- Automatic cleanup prevents memory leaks

## Testing
Test the middleware functionality:
```bash
# Run unit tests
npm run test:unit

# Test authentication flow
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/protected

# Test rate limiting
for i in {1..150}; do curl http://localhost:3000/api/health; done
```

## Troubleshooting

### Common Issues
1. **JWT_SECRET not configured**: Ensure environment variable is set
2. **CORS errors**: Add origin to ALLOWED_ORIGINS
3. **Rate limit too restrictive**: Adjust RATE_LIMIT environment variable
4. **Token expired**: Implement token refresh logic in client

## Migration from Old Middleware
The previous middleware (`src/middleware-old.ts`) has been replaced with this enhanced version. Key improvements:
- Added rate limiting
- Enhanced security headers
- Better error handling
- Edge runtime optimization