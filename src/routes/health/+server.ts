import type { RequestHandler } from './$types';

/**
 * Health check endpoint for Kubernetes probes
 * 
 * Used by:
 * - K8s livenessProbe: Is the container alive?
 * - K8s readinessProbe: Is the container ready to receive traffic?
 * - Docker HEALTHCHECK
 * 
 * Returns a simple JSON response with status and optional metadata.
 */
export const GET: RequestHandler = async () => {
	// In the future, you could add checks here:
	// - Database connectivity
	// - NATS connection status
	// - Memory/CPU thresholds
	
	return new Response(
		JSON.stringify({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || 'unknown'
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		}
	);
};
