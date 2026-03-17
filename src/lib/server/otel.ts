/**
 * Server-side OpenTelemetry initialization for the SvelteKit Node.js runtime.
 *
 * Mirrors the pattern in frolf-bot-shared/observability — all three signals
 * (traces, metrics, logs) exported via OTLP HTTP to the internal Alloy endpoint.
 *
 * Reads PRIVATE_OTEL_ENDPOINT from the environment (e.g.
 * http://alloy.observability.svc.cluster.local:4318 in production).
 * When the variable is unset, all providers fall back to no-ops so the app
 * works normally without any observability infrastructure.
 */

import { trace, metrics, type Tracer, type Meter, isSpanContextValid } from '@opentelemetry/api';
import { logs, type Logger } from '@opentelemetry/api-logs';
import { NodeTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SeverityNumber, type LogRecord } from '@opentelemetry/api-logs';

const SERVICE_NAME = 'frolf-pwa';
const SERVICE_VERSION = process.env.npm_package_version ?? '0.0.0';

let shutdownFn: (() => Promise<void>) | null = null;
let initialized = false;

export function initServerOtel(): void {
	if (initialized) return;

	const baseUrl = process.env.PRIVATE_OTEL_ENDPOINT;
	if (!baseUrl) {
		initialized = true;
		return;
	}

	try {
		const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

		const resource = resourceFromAttributes({
			'service.name': SERVICE_NAME,
			'service.version': SERVICE_VERSION,
			'deployment.environment.name': environment,
			'deployment.environment': environment
		});

		// ── Traces ────────────────────────────────────────────────────────────────
		const traceExporter = new OTLPTraceExporter({ url: `${baseUrl}/v1/traces` });
		const tracerProvider = new NodeTracerProvider({
			resource,
			spanProcessors: [new BatchSpanProcessor(traceExporter)]
		});
		tracerProvider.register();

		// ── Metrics ───────────────────────────────────────────────────────────────
		const metricExporter = new OTLPMetricExporter({ url: `${baseUrl}/v1/metrics` });
		const meterProvider = new MeterProvider({
			resource,
			readers: [
				new PeriodicExportingMetricReader({
					exporter: metricExporter,
					exportIntervalMillis: 30_000
				})
			]
		});
		metrics.setGlobalMeterProvider(meterProvider);

		// ── Logs ──────────────────────────────────────────────────────────────────
		const logExporter = new OTLPLogExporter({ url: `${baseUrl}/v1/logs` });
		const loggerProvider = new LoggerProvider({
			resource,
			processors: [new BatchLogRecordProcessor(logExporter)]
		});
		logs.setGlobalLoggerProvider(loggerProvider);

		shutdownFn = async () => {
			await Promise.all([
				tracerProvider.shutdown(),
				meterProvider.shutdown(),
				loggerProvider.shutdown()
			]);
		};

		// Emit a startup log so Loki registers this service immediately.
		// Without this, frolf-pwa won't appear in Grafana's log drilldown
		// until a 4xx/5xx error occurs.
		logs.getLogger(SERVICE_NAME).emit({
			severityNumber: SeverityNumber.INFO,
			severityText: 'INFO',
			body: 'frolf-pwa server started',
			attributes: {
				'service.version': SERVICE_VERSION,
				'deployment.environment': environment
			}
		});

		initialized = true;
	} catch (err) {
		// OTel init failure: can't log to OTel itself, so stderr is the only option.
		// This will surface in kubectl logs / container stdout.
		console.error('[OTel] Failed to initialize server OTel:', err);
	}
}

export async function shutdownServerOtel(): Promise<void> {
	if (shutdownFn) await shutdownFn();
}

export function getServerTracer(name: string = SERVICE_NAME): Tracer {
	return trace.getTracer(name);
}

export function getServerMeter(name: string = SERVICE_NAME): Meter {
	return metrics.getMeter(name);
}

export function getServerLogger(name: string = SERVICE_NAME): Logger {
	return logs.getLogger(name);
}

/**
 * Emit a structured log record from the server, automatically attaching the
 * active trace context (trace_id + span_id) for Grafana trace ↔ log correlation.
 */
export function emitServerLog(
	severity: SeverityNumber,
	message: string,
	attributes?: Record<string, string | number | boolean>
): void {
	const logger = getServerLogger();

	const spanContext = trace.getActiveSpan()?.spanContext();
	const traceAttrs: Record<string, string> = {};
	if (spanContext && isSpanContextValid(spanContext)) {
		traceAttrs['trace_id'] = spanContext.traceId;
		traceAttrs['span_id'] = spanContext.spanId;
	}

	const record: LogRecord = {
		severityNumber: severity,
		severityText: SeverityNumber[severity],
		body: message,
		attributes: { ...traceAttrs, ...attributes }
	};

	logger.emit(record);
}
