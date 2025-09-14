import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Environment
  environment: process.env.NODE_ENV,

  // Server-specific options
  autoSessionTracking: false,

  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      return null;
    }

    // Filter out sensitive data
    if (event.request) {
      // Remove auth headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive query params
      if (event.request.query_string) {
        event.request.query_string = event.request.query_string.replace(
          /token=[^&]*/g,
          'token=***'
        );
      }
    }

    // Filter out non-critical errors
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as any).statusCode;
      // Don't report client errors (4xx)
      if (statusCode >= 400 && statusCode < 500) {
        return null;
      }
    }

    return event;
  },

  integrations: [
    // Profiling
    Sentry.nodeProfilingIntegration(),
  ],
});