import { env as privateEnv } from '$env/dynamic/private';
import { config as publicConfig } from '$lib/config';

const isProduction = import.meta.env.PROD;
const defaultFallbackHosts = new Set(['localhost', '127.0.0.1', 'api.frolf-bot.com']);

function parseUrl(raw: string): URL {
	try {
		return new URL(raw);
	} catch {
		throw new Error(`Invalid backend URL: ${raw}`);
	}
}

function parseAllowlist(raw: string | undefined): Set<string> {
	return new Set(
		(raw || '')
			.split(',')
			.map((host) => host.trim())
			.filter(Boolean)
	);
}

function resolveBackendUrl(): string {
	const privateApiUrl = privateEnv.PRIVATE_API_URL?.trim();
	if (isProduction && !privateApiUrl) {
		throw new Error('PRIVATE_API_URL is required in production');
	}

	const candidate = privateApiUrl || publicConfig.api.url || 'http://localhost:8080';
	const parsed = parseUrl(candidate);

	if (privateApiUrl) {
		const allowlist = parseAllowlist(privateEnv.PRIVATE_API_HOST_ALLOWLIST);
		if (allowlist.size > 0 && !allowlist.has(parsed.hostname)) {
			throw new Error(`PRIVATE_API_URL host not allowed: ${parsed.hostname}`);
		}
	} else if (!defaultFallbackHosts.has(parsed.hostname)) {
		throw new Error(`Unsafe fallback API host: ${parsed.hostname}`);
	}

	return parsed.origin;
}

/**
 * Server-only configuration that can securely handle private environment variables.
 * Fallbacks to public configuration if private overrides are not present.
 */
export const serverConfig = {
	/**
	 * Backend API URL for server-to-server communication.
	 * In production/K8s, this might be an internal service name like 'http://backend:3001'.
	 * Locally, it defaults to the same as the public API URL or localhost:8080.
	 */
	backendUrl: resolveBackendUrl()
} as const;
