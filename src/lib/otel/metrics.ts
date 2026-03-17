import { metrics, type Meter } from '@opentelemetry/api';
import { env } from '$env/dynamic/public';

let initialized = false;

export function getMeter(name: string = 'frolf-pwa'): Meter {
	return metrics.getMeter(name);
}

export async function initMetrics(): Promise<void> {
	if (initialized) return;

	try {
		const baseUrl = env.PUBLIC_OTEL_ENDPOINT;
		if (!baseUrl) {
			initialized = true;
			return;
		}

		// Dynamic imports to reduce initial bundle size
		const [
			{ MeterProvider, PeriodicExportingMetricReader },
			{ OTLPMetricExporter },
			{ resourceFromAttributes }
		] = await Promise.all([
			import('@opentelemetry/sdk-metrics'),
			import('@opentelemetry/exporter-metrics-otlp-http'),
			import('@opentelemetry/resources')
		]);

		const resource = resourceFromAttributes({
			'service.name': 'frolf-pwa',
			'service.version': __APP_VERSION__,
			'deployment.environment': import.meta.env.MODE
		});

		const exporter = new OTLPMetricExporter({
			url: `${baseUrl}/v1/metrics`
		});

		const provider = new MeterProvider({
			resource,
			readers: [
				new PeriodicExportingMetricReader({
					exporter,
					exportIntervalMillis: 30_000
				})
			]
		});

		metrics.setGlobalMeterProvider(provider);

		recordNavigationTiming();

		initialized = true;
	} catch (err) {
		console.error('[OTel] Failed to initialize metrics:', err);
	}
}

// Record page navigation timing from the browser Performance API.
function recordNavigationTiming(): void {
	try {
		const nav = performance.getEntriesByType('navigation')[0] as
			| PerformanceNavigationTiming
			| undefined;
		if (!nav) return;

		const meter = getMeter();
		const pageLoadDuration = meter.createHistogram('browser.page_load.duration', {
			description: 'Page load duration in milliseconds',
			unit: 'ms'
		});
		const ttfb = meter.createHistogram('browser.ttfb.duration', {
			description: 'Time to first byte in milliseconds',
			unit: 'ms'
		});

		pageLoadDuration.record(nav.loadEventEnd - nav.startTime, {
			'page.url': location.pathname
		});
		ttfb.record(nav.responseStart - nav.requestStart, {
			'page.url': location.pathname
		});
	} catch {
		// Non-critical; ignore if Performance API unavailable
	}
}
