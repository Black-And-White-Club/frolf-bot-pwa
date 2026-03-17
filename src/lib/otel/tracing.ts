import {
	trace,
	context,
	type Tracer,
	type Context,
	type TextMapPropagator
} from '@opentelemetry/api';
import { env } from '$env/dynamic/public';

let propagator: TextMapPropagator | null = null;
let initialized = false;

// Get tracer instance
export function getTracer(name: string = 'frolf-pwa'): Tracer {
	return trace.getTracer(name);
}

// Create a span for an operation
// Uses startActiveSpan so the span is pushed onto the OTel context stack,
// enabling trace-log correlation via trace.getActiveSpan().
export function withSpan<T>(
	name: string,
	fn: () => T,
	attributes?: Record<string, string | number | boolean>
): T {
	return getTracer().startActiveSpan(name, { attributes }, (span) => {
		try {
			const result = fn();
			span.end();
			return result;
		} catch (err) {
			span.recordException(err as Error);
			span.end();
			throw err;
		}
	});
}

// Create async span
// Uses startActiveSpan so the span is pushed onto the OTel context stack,
// enabling trace-log correlation via trace.getActiveSpan().
export async function withAsyncSpan<T>(
	name: string,
	fn: () => Promise<T>,
	attributes?: Record<string, string | number | boolean>
): Promise<T> {
	return getTracer().startActiveSpan(name, { attributes }, async (span) => {
		try {
			const result = await fn();
			span.end();
			return result;
		} catch (err) {
			span.recordException(err as Error);
			span.end();
			throw err;
		}
	});
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
		// PUBLIC_OTEL_ENDPOINT is now the base URL (e.g. https://frolf-bot.duckdns.org).
		// Each signal exporter appends its own path (/v1/traces, /v1/metrics, /v1/logs).
		const baseUrl = env.PUBLIC_OTEL_ENDPOINT;

		// Strictly require an endpoint to be configured to enable tracing.
		// This avoids loading OTel SDK/exporter code in sessions where tracing is disabled.
		if (!baseUrl) {
			initialized = true;
			return;
		}

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

		const resource = resourceFromAttributes({
			'service.name': 'frolf-pwa',
			'service.version': __APP_VERSION__,
			'deployment.environment': import.meta.env.MODE
		});

		const exporter = new OTLPTraceExporter({
			url: `${baseUrl}/v1/traces`
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
