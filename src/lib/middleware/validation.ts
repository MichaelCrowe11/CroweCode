import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

export type ValidationConfig = {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
};

/**
 * Validates request data against Zod schemas
 */
export async function validateRequest(
  req: NextRequest,
  config: ValidationConfig
) {
  const errors: Record<string, any> = {};

  try {
    // Validate body
    if (config.body) {
      const body = await req.json().catch(() => ({}));
      const result = config.body.safeParse(body);
      if (!result.success) {
        errors.body = formatZodError(result.error);
      }
    }

    // Validate query parameters
    if (config.query) {
      const searchParams = Object.fromEntries(req.nextUrl.searchParams);
      const result = config.query.safeParse(searchParams);
      if (!result.success) {
        errors.query = formatZodError(result.error);
      }
    }

    // Validate URL params (if needed)
    if (config.params) {
      // This would need to be passed from the route handler
      // as Next.js doesn't expose params in middleware
    }

    // If there are validation errors, return error response
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    return null; // No errors
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Failed to validate request',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 400 }
    );
  }
}

/**
 * Format Zod errors for API response
 */
function formatZodError(error: ZodError) {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
}

/**
 * Higher-order function to wrap API handlers with validation
 */
export function withValidation<T = any>(
  config: ValidationConfig,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Validate request
    const validationError = await validateRequest(req, config);
    if (validationError) {
      return validationError;
    }

    // Parse validated data
    const data: any = {};

    if (config.body) {
      const body = await req.json().catch(() => ({}));
      data.body = config.body.parse(body);
    }

    if (config.query) {
      const searchParams = Object.fromEntries(req.nextUrl.searchParams);
      data.query = config.query.parse(searchParams);
    }

    // Call the handler with validated data
    return handler(req, data as T);
  };
}

/**
 * Validate and parse request body
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        error: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: formatZodError(result.error),
            },
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data };
  } catch (error) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse request body',
          },
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate and parse query parameters
 */
export function parseQuery<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): { data?: T; error?: NextResponse } {
  const searchParams = Object.fromEntries(req.nextUrl.searchParams);
  const result = schema.safeParse(searchParams);

  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: formatZodError(result.error),
          },
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}