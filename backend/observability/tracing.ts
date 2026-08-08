// OpenTelemetry Tracing Setup
// Disabled due to import compatibility issues with newer OpenTelemetry versions
// TODO: Update to use correct semantic conventions when needed
let sdk: any = null;

if (process.env.ENABLE_OTEL_SDK === 'true' && !process.env.SENTRY_DSN) {
  console.log('[Tracing] OpenTelemetry SDK temporarily disabled due to import compatibility');
} else if (process.env.SENTRY_DSN) {
  console.log('[Tracing] using Sentry-managed OpenTelemetry (standalone SDK disabled)');
} else {
  console.log('[Tracing] OpenTelemetry disabled (set ENABLE_OTEL_SDK=true to enable standalone tracing)');
}

// Export tracer for manual instrumentation. Falls back to a no-op when no SDK is
// running (the common case — Sentry handles tracing in production).
export const tracer = (sdk as any)?.tracerProvider?.getTracer('simtrace-backend') || {
  startSpan: (_name: string, _options?: any) => ({
    setAttribute: () => {},
    setStatus: () => {},
    recordException: () => {},
    end: () => {},
  }),
};

// Helper function to create spans
export async function withTracing<T>(name: string, fn: () => Promise<T>, attributes: any = {}): Promise<T> {
  const span = tracer.startSpan(name, { attributes });

  try {
    const result = await fn();
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
    throw error;
  } finally {
    span.end();
  }
}

// Decorator for automatic tracing
export function traced(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withTracing(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { operationName }
      );
    };

    return descriptor;
  };
}
