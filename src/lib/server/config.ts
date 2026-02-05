import { env as privateEnv } from '$env/dynamic/private';
import { config as publicConfig } from '$lib/config';

/**
 * Server-only configuration that can securely handle private environment variables.
 * Fallbacks to public configuration if private overrides are not present.
 */
export const serverConfig = {
	/**
	 * Backend API URL for server-to-server communication.
	 * In production/K8s, this might be an internal service name like 'http://backend:3001'.
	 * Locally, it defaults to the same as the public API URL or localhost:3001.
	 */
	backendUrl: privateEnv.PRIVATE_API_URL || publicConfig.api.url || 'http://localhost:3001'
} as const;
