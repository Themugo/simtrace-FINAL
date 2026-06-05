// OpenTelemetry Tracing Setup
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// IMPORTANT: @sentry/node (v8+) initialises its OWN OpenTelemetry SDK whenever a
// SENTRY_DSN is configured. Starting a SECOND NodeSDK here makes both SDKs contend
// for the global tracer provider during import and HANGS process startup — the
// HTTP port never binds and the platform (e.g. Render) times out the deploy.
//
// So the standalone SDK is OFF by default. It only starts when explicitly opted in
// (ENABLE_OTEL_SDK=true) AND Sentry is NOT already managing tracing (no SENTRY_DSN).
// When Sentry is active it provides the tracing; the no-op tracer fallback below
// keeps withTracing()/traced() working in every case.
let sdk: NodeSDK | null = null;

if (process.env.ENABLE_OTEL_SDK === 'true' && !process.env.SENTRY_DSN) {
  try {
    sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'simtrace-backend',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }) as any,
      spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter() as any) as any,
      // Add more exporters as needed (e.g., Jaeger, OTLP)
    });
    sdk.start();
    console.log('[Tracing] standalone OpenTelemetry SDK started');
  } catch (error) {
    console.error('[Tracing] Failed to initialize OpenTelemetry:', error);
    sdk = null;
  }
} else if (process.env.SENTRY_DSN) {
  console.log('[Tracing] using Sentry-managed OpenTelemetry (standalone SDK disabled)');
} else {
  console.log('[Tracing] OpenTelemetry disabled (set ENABLE_OTEL_SDK=true to enable standalone tracing)');
}

// Export tracer for manual instrumentation. Falls back to a no-op when no SDK is
// running (the common case — Sentry handles tracing in production).
export const tracer = (sdk as any)?.tracerProvider?.getTracer('simtrace-backend') || {
  startSpan: (name: string, options?: any) => ({
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
