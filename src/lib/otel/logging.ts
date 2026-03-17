import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { trace, isSpanContextValid } from '@opentelemetry/api';
import { env } from '$env/dynamic/public';

let initialized = false;
let uninstallConsoleBridge: (() => void) | null = null;

export async function initLogs(): Promise<void> {
	if (initialized) return;

	try {
		const baseUrl = env.PUBLIC_OTEL_ENDPOINT;
		if (!baseUrl) {
			initialized = true;
			return;
		}

		// Dynamic imports to reduce initial bundle size
		const [
			{ LoggerProvider, BatchLogRecordProcessor },
			{ OTLPLogExporter },
			{ resourceFromAttributes }
		] = await Promise.all([
			import('@opentelemetry/sdk-logs'),
			import('@opentelemetry/exporter-logs-otlp-http'),
			import('@opentelemetry/resources')
		]);

		const resource = resourceFromAttributes({
			'service.name': 'frolf-pwa',
			'service.version': __APP_VERSION__,
			'deployment.environment': import.meta.env.MODE
		});

		const exporter = new OTLPLogExporter({
			url: `${baseUrl}/v1/logs`
		});

		const provider = new LoggerProvider({
			resource,
			processors: [new BatchLogRecordProcessor(exporter)]
		});

		logs.setGlobalLoggerProvider(provider);

		initialized = true;

		uninstallConsoleBridge = installConsoleBridge();
	} catch (err) {
		console.error('[OTel] Failed to initialize logs:', err);
	}
}

// Emit a structured log record, automatically attaching the active trace context.
export function emitLog(
	severity: SeverityNumber,
	message: string,
	attributes?: Record<string, string | number | boolean>
): void {
	if (!initialized) return;

	const logger = logs.getLogger('frolf-pwa');
	const spanContext = trace.getActiveSpan()?.spanContext();
	const traceAttrs: Record<string, string> = {};
	if (spanContext && isSpanContextValid(spanContext)) {
		traceAttrs['trace_id'] = spanContext.traceId;
		traceAttrs['span_id'] = spanContext.spanId;
	}

	logger.emit({
		severityNumber: severity,
		severityText: SeverityNumber[severity],
		body: message,
		attributes: { ...traceAttrs, ...attributes }
	});
}

// Replace console.error and console.warn with OTel-forwarding versions.
// Original implementations are preserved for local output.
// NOTE: All console output is forwarded to the telemetry backend — never log
// sensitive data (tokens, passwords, PII) to console.error or console.warn.

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
const SENSITIVE_KV_PATTERN =
	/\b(password|passwd|secret|token|key|auth|credential|api_?key|private)\s*[=:]\s*\S+/gi;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MAX_LOG_LENGTH = 2000;

function sanitize(raw: string): string {
	return raw
		.slice(0, MAX_LOG_LENGTH)
		.replace(JWT_PATTERN, '[JWT_REDACTED]')
		.replace(SENSITIVE_KV_PATTERN, (m) => {
			const sep = m.search(/[=:]/);
			return m.slice(0, sep + 1) + '[REDACTED]';
		})
		.replace(EMAIL_PATTERN, '[EMAIL_REDACTED]');
}

// Returns an uninstall function that restores the original console methods.
// A _bridgeActive guard prevents recursive loops if the OTLP exporter itself
// calls console.error (e.g. on a network failure during export).
function installConsoleBridge(): () => void {
	const originalError = console.error.bind(console);
	const originalWarn = console.warn.bind(console);
	let _bridgeActive = false;

	console.error = (...args: unknown[]) => {
		originalError(...args);
		if (_bridgeActive) return;
		_bridgeActive = true;
		try {
			emitLog(SeverityNumber.ERROR, sanitize(args.map(String).join(' ')), {
				'log.source': 'console.error'
			});
		} finally {
			_bridgeActive = false;
		}
	};

	console.warn = (...args: unknown[]) => {
		originalWarn(...args);
		if (_bridgeActive) return;
		_bridgeActive = true;
		try {
			emitLog(SeverityNumber.WARN, sanitize(args.map(String).join(' ')), {
				'log.source': 'console.warn'
			});
		} finally {
			_bridgeActive = false;
		}
	};

	return () => {
		console.error = originalError;
		console.warn = originalWarn;
	};
}

export function teardownLogs(): void {
	uninstallConsoleBridge?.();
	uninstallConsoleBridge = null;
	initialized = false;
}
