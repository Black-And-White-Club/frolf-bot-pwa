import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION
} from '@opentelemetry/semantic-conventions';
import { trace, context, type Tracer, type Context } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

const resource = resourceFromAttributes({
	[ATTR_SERVICE_NAME]: 'frolf-pwa',
	[ATTR_SERVICE_VERSION]: '0.4.0',
	'deployment.environment': import.meta.env.MODE
});

const exporter = new OTLPTraceExporter({
	url: import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces'
});

const provider = new WebTracerProvider({
	resource,
	spanProcessors: [new BatchSpanProcessor(exporter)]
});

provider.register();

const propagator = new W3CTraceContextPropagator();

// Get tracer instance
export function getTracer(name: string = 'frolf-pwa'): Tracer {
	return trace.getTracer(name);
}

// Create a span for an operation
export function withSpan<T>(
	name: string,
	fn: () => T,
	attributes?: Record<string, string | number | boolean>
): T {
	const tracer = getTracer();
	const span = tracer.startSpan(name, { attributes });

	try {
		const result = fn();
		span.end();
		return result;
	} catch (err) {
		span.recordException(err as Error);
		span.end();
		throw err;
	}
}

// Create async span
export async function withAsyncSpan<T>(
	name: string,
	fn: () => Promise<T>,
	attributes?: Record<string, string | number | boolean>
): Promise<T> {
	const tracer = getTracer();
	const span = tracer.startSpan(name, { attributes });

	try {
		const result = await fn();
		span.end();
		return result;
	} catch (err) {
		span.recordException(err as Error);
		span.end();
		throw err;
	}
}

// Extract traceparent from headers
export function extractTraceContext(headers: Record<string, string>): Context {
	return propagator.extract(context.active(), headers, {
		get: (carrier, key) => carrier[key],
		keys: (carrier) => Object.keys(carrier)
	});
}

// Inject traceparent into headers
export function injectTraceContext(headers: Record<string, string>): void {
	propagator.inject(context.active(), headers, {
		set: (carrier, key, value) => {
			carrier[key] = value;
		}
	});
}

// Create child span from traceparent
export function createChildSpan(
	name: string,
	traceparent: string | undefined,
	attributes?: Record<string, string | number | boolean>
) {
	const tracer = getTracer();

	if (traceparent) {
		const parentContext = extractTraceContext({ traceparent });
		return tracer.startSpan(name, { attributes }, parentContext);
	}

	return tracer.startSpan(name, { attributes });
}

let initialized = false;

export function initTracing(): void {
	if (initialized) return;

	// Provider is registered on module load
	// This function exists for explicit initialization if needed
	initialized = true;

	console.log('[OTel] Tracing initialized', {
		service: 'frolf-pwa',
		endpoint: import.meta.env.VITE_OTEL_ENDPOINT,
		mode: import.meta.env.MODE
	});
}
