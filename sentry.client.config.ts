import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Environment
  environment: process.env.NODE_ENV,

  // Filtering
  ignoreErrors: [
    // Browser errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Network errors
    'NetworkError',
    'Network request failed',
    // User cancellations
    'AbortError',
    'The user aborted a request',
  ],

  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      return null;
    }

    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});