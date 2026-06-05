import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  beforeSend(event, hint) {
    // Filter out certain errors if needed
    if (event.exception) {
      const error = hint.originalException as Error | undefined;
      // Example: filter out specific error types
      if (error && error.message && error.message.includes('ResizeObserver')) {
        return null;
      }
    }
    return event;
  },
  
  beforeSendTransaction(event) {
    // Filter out certain transactions if needed
    return event;
  },
});

export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log("Sentry initialized successfully");
  }
}

// Capture errors thrown in nested React Server Components (Next.js onRequestError hook).
export const onRequestError = Sentry.captureRequestError;
