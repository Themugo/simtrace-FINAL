// OpenTelemetry Tracing Setup
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'simtrace-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
  // Add more exporters as needed (e.g., Jaeger, OTLP)
});

// Start the SDK
try {
  sdk.start();
  console.log('[Tracing] OpenTelemetry initialized');
} catch (error) {
  console.error('[Tracing] Failed to initialize OpenTelemetry:', error);
}

// Export tracer for manual instrumentation
// Note: tracerProvider may not be immediately available after start()
export const tracer = (sdk as any).tracerProvider?.getTracer('simtrace-backend') || {
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
