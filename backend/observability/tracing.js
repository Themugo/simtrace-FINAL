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
sdk.start();

console.log('[Tracing] OpenTelemetry initialized');

// Export tracer for manual instrumentation
export const tracer = sdk.tracerProvider.getTracer('simtrace-backend');

// Helper function to create spans
export async function withTracing(name, fn, attributes = {}) {
  const span = tracer.startSpan(name, { attributes });
  
  try {
    const result = await fn();
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message }); // ERROR
    throw error;
  } finally {
    span.end();
  }
}

// Decorator for automatic tracing
export function traced(operationName) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      return withTracing(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { operationName }
      );
    };

    return descriptor;
  };
}
