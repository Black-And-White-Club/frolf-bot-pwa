import { trace, context, type Tracer, type Context, type TextMapPropagator } from '@opentelemetry/api';

let propagator: TextMapPropagator | null = null;
let initialized = false;

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
	if (!propagator) return context.active();
	
	return propagator.extract(context.active(), headers, {
		get: (carrier, key) => carrier[key],
		keys: (carrier) => Object.keys(carrier)
	});
}

// Inject traceparent into headers
export function injectTraceContext(headers: Record<string, string>): void {
	if (!propagator) return;

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

export async function initTracing(): Promise<void> {
	if (initialized) return;

	try {
		// Dynamic imports to reduce initial bundle size
		const [
			{ WebTracerProvider, BatchSpanProcessor },
			{ OTLPTraceExporter },
			{ resourceFromAttributes },
			{ W3CTraceContextPropagator }
		] = await Promise.all([
			import('@opentelemetry/sdk-trace-web'),
			import('@opentelemetry/exporter-trace-otlp-http'),
			import('@opentelemetry/resources'),
			import('@opentelemetry/core')
		]);

		const endpoint = import.meta.env.VITE_OTEL_ENDPOINT;
		
		// Strictly require an endpoint to be configured to enable tracing.
		// This prevents "connection refused" errors in any environment (dev or prod)
		// where a collector is not explicitly available.
		if (!endpoint) {
			// console.debug('[OTel] Tracing disabled: VITE_OTEL_ENDPOINT is not set');
			return;
		}

		const resource = resourceFromAttributes({
			'service.name': 'frolf-pwa',
			'service.version': '0.4.0',
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

		// Initialize propagator
		propagator = new W3CTraceContextPropagator();

		initialized = true;

		// Tracing ready
	} catch (err) {
		console.error('[OTel] Failed to initialize tracing:', err);
	}
}
