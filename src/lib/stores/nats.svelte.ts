/**
 * NATS Service Singleton
 * Central connection manager for Direct-to-NATS architecture
 */

import type { NatsConnection, Subscription, Codec } from 'nats.ws'; // Types only
import { getTracer, injectTraceContext, createChildSpan } from '$lib/otel/tracing';
import { config, log } from '$lib/config';

// ============ Types ============

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
type NatsLib = typeof import('nats.ws');

interface NatsMessage<T = unknown> {
	subject: string;
	data: T;
	headers?: Map<string, string[]>;
}

type CypressNatsBridge = {
	subscribe: (subject: string, handler: (payload: unknown) => void) => () => void;
	publish: (subject: string, payload: unknown) => void;
	request: (subject: string, payload: unknown, timeoutMs?: number) => Promise<unknown>;
};

type CypressWindowBridge = Window &
	typeof globalThis & {
		__FROLF_CYPRESS_NATS__?: CypressNatsBridge;
	};

// ============ NatsService Class ============

class NatsService {
	// State
	connection = $state<NatsConnection | null>(null);
	status = $state<ConnectionStatus>('disconnected');
	lastError = $state<string | null>(null);
	reconnectAttempts = $state(0);

	// Derived
	isConnected = $derived(this.status === 'connected');
	isReconnecting = $derived(this.status === 'reconnecting');

	// Private
	private subscriptions: Map<string, Subscription> = new Map();
	private codec: Codec<string> | null = null;
	private natsLib: NatsLib | null = null;
	private reconnectListeners: Set<() => void | Promise<void>> = new Set();
	private cypressBridge: CypressNatsBridge | null = null;
	private cypressSubscriptions: Map<string, () => void> = new Map();

	/**
	 * Connect to NATS server with JWT token
	 */
	async connect(token: string): Promise<void> {
		if (this.status === 'connecting' || this.status === 'connected') {
			return;
		}

		const bridge = this.getCypressBridge();
		if (bridge) {
			this.cypressBridge = bridge;
			this.status = 'connected';
			this.lastError = null;
			this.reconnectAttempts = 0;
			log('Connected to Cypress NATS bridge with token length:', token?.length);
			return;
		}

		// Dynamic import to save bundle size
		if (!this.natsLib) {
			this.natsLib = await import('nats.ws');
			this.codec = this.natsLib.StringCodec();
		}

		const tracer = getTracer();
		const span = tracer.startSpan('nats.connect', {
			attributes: { 'messaging.system': 'nats' }
		});

		this.status = 'connecting';
		this.lastError = null;
		log('Connecting to NATS with token length:', token?.length);

		try {
			this.connection = await this.natsLib.connect({
				servers: config.nats.url,
				user: 'frolf-pwa-user', // Dummy user required for NATS to include the password in Auth Callout
				pass: token,
				name: 'frolf-pwa',
				reconnect: true,
				maxReconnectAttempts: config.nats.reconnectAttempts,
				reconnectTimeWait: config.nats.reconnectDelayMs
			});

			this.status = 'connected';
			this.reconnectAttempts = 0;
			log('Connected to NATS:', config.nats.url);
			span.end();

			// Monitor connection status
			(async () => {
				for await (const status of this.connection!.status()) {
					switch (status.type) {
						case 'disconnect':
							this.status = 'reconnecting';
							break;
						case 'reconnect':
							this.status = 'connected';
							this.reconnectAttempts = 0;
							void this.emitReconnect();
							break;
						case 'error':
							this.lastError = status.data?.toString() ?? 'Unknown error';
							break;
					}
				}
			})();
		} catch (err) {
			this.status = 'error';
			this.lastError = err instanceof Error ? err.message : 'Connection failed';
			span.recordException(err as Error);
			span.end();
			throw err;
		}
	}

	private getCypressBridge(): CypressNatsBridge | null {
		if (typeof window === 'undefined') {
			return null;
		}
		return (window as CypressWindowBridge).__FROLF_CYPRESS_NATS__ ?? null;
	}

	/**
	 * Disconnect from NATS server
	 */
	async disconnect(): Promise<void> {
		if (this.cypressBridge) {
			this.unsubscribeAll();
			this.cypressBridge = null;
			this.status = 'disconnected';
			this.reconnectAttempts = 0;
			return;
		}

		if (this.connection) {
			await this.connection.close();
			this.connection = null;
		}
		this.status = 'disconnected';
		this.reconnectAttempts = 0;
	}

	/**
	 * Subscribe to a NATS subject
	 * Returns unsubscribe function for $effect cleanup
	 */
	subscribe<T>(subject: string, handler: (msg: NatsMessage<T>) => void): () => void {
		if (this.cypressBridge) {
			this.unsubscribe(subject);
			const unsubscribe = this.cypressBridge.subscribe(subject, (payload) => {
				handler({
					subject,
					data: payload as T,
					headers: new Map<string, string[]>()
				});
			});
			this.cypressSubscriptions.set(subject, unsubscribe);
			return () => this.unsubscribe(subject);
		}

		if (!this.connection || !this.codec) {
			console.warn('Cannot subscribe: not connected');
			return () => {};
		}

		// Unsubscribe existing if re-subscribing
		this.unsubscribe(subject);

		const sub = this.connection.subscribe(subject);
		this.subscriptions.set(subject, sub);

		// Process messages
		(async () => {
			for await (const msg of sub) {
				// Extract traceparent if present
				const traceparent = msg.headers?.get('traceparent')?.[0];

				// Create span for message processing
				const span = createChildSpan(`nats.receive.${subject}`, traceparent, {
					'messaging.system': 'nats',
					'messaging.destination': subject
				});

				try {
					const data = JSON.parse(this.codec!.decode(msg.data)) as T;
					// local headers map for downstream handlers
					// eslint-disable-next-line svelte/prefer-svelte-reactivity
					const headers = new Map<string, string[]>();

					if (msg.headers) {
						for (const [key, values] of msg.headers) {
							headers.set(key, values);
						}
					}

					handler({ subject: msg.subject, data, headers });
					span.end();
				} catch (err) {
					span.recordException(err as Error);
					span.end();
					console.error(`Error processing message on ${subject}:`, err);
				}
			}
		})();

		// Return unsubscribe function
		return () => this.unsubscribe(subject);
	}

	/**
	 * Unsubscribe from a NATS subject
	 */
	unsubscribe(subject: string): void {
		if (this.cypressBridge) {
			const unsubscribe = this.cypressSubscriptions.get(subject);
			if (unsubscribe) {
				unsubscribe();
				this.cypressSubscriptions.delete(subject);
			}
			return;
		}

		const sub = this.subscriptions.get(subject);
		if (sub) {
			sub.unsubscribe();
			this.subscriptions.delete(subject);
		}
	}

	/**
	 * Unsubscribe from all subjects
	 */
	unsubscribeAll(): void {
		if (this.cypressBridge) {
			for (const unsubscribe of this.cypressSubscriptions.values()) {
				unsubscribe();
			}
			this.cypressSubscriptions.clear();
			return;
		}

		for (const sub of this.subscriptions.values()) {
			sub.unsubscribe();
		}
		this.subscriptions.clear();
	}

	onReconnect(listener: () => void | Promise<void>): () => void {
		this.reconnectListeners.add(listener);
		return () => {
			this.reconnectListeners.delete(listener);
		};
	}

	private async emitReconnect(): Promise<void> {
		for (const listener of this.reconnectListeners) {
			try {
				await listener();
			} catch (error) {
				console.error('NATS reconnect listener failed:', error);
			}
		}
	}

	/**
	 * Publish a message to a NATS subject
	 */
	publish<T>(subject: string, data: T, customHeaders?: Record<string, string>): void {
		if (this.cypressBridge) {
			void customHeaders;
			this.cypressBridge.publish(subject, data);
			return;
		}

		if (!this.connection || !this.natsLib || !this.codec) {
			console.warn('Cannot publish: not connected');
			return;
		}

		const tracer = getTracer();
		const span = tracer.startSpan(`nats.publish.${subject}`, {
			attributes: {
				'messaging.system': 'nats',
				'messaging.destination': subject
			}
		});

		try {
			const payload = this.codec.encode(JSON.stringify(data));
			const natsHeaders = this.natsLib.headers();

			// Inject traceparent
			const traceHeaders: Record<string, string> = {};
			injectTraceContext(traceHeaders);

			// Add trace headers
			for (const [key, value] of Object.entries(traceHeaders)) {
				natsHeaders.append(key, value);
			}

			// Add custom headers
			if (customHeaders) {
				for (const [key, value] of Object.entries(customHeaders)) {
					natsHeaders.append(key, value);
				}
			}

			this.connection.publish(subject, payload, { headers: natsHeaders });
			span.end();
		} catch (err) {
			span.recordException(err as Error);
			span.end();
			throw err;
		}
	}

	/**
	 * Send a request and wait for reply (request/reply pattern)
	 * Uses a custom implementation that works with JetStream consumers
	 * by including the reply_to subject in the message headers.
	 */
	async request<TReq, TRes>(
		subject: string,
		data: TReq,
		options: { timeout?: number } = {}
	): Promise<TRes | null> {
		if (this.cypressBridge) {
			return this.requestViaCypressBridge(subject, data, options.timeout);
		}

		const requestDeps = this.getRequestDependencies();
		const timeout = options.timeout ?? 5000;
		const payload = requestDeps.codec.encode(JSON.stringify(data));

		const tracer = getTracer();
		const span = tracer.startSpan(`nats.request.${subject}`, {
			attributes: {
				'messaging.system': 'nats',
				'messaging.destination': subject
			}
		});

		// Create a unique inbox for this request
		const inbox = requestDeps.natsLib.createInbox();

		try {
			// Subscribe to the inbox for the response
			const sub = requestDeps.connection.subscribe(inbox, { max: 1, timeout });

			// Create headers with reply_to for JetStream compatibility
			const natsHeaders = this.buildRequestHeaders(requestDeps.natsLib, inbox);

			// Publish the request with the reply_to header
			requestDeps.connection.publish(subject, payload, { headers: natsHeaders });
			const response = await this.readRequestResponse<TRes>(sub, requestDeps.codec, subject);
			span.end();
			return response;
		} catch (e) {
			span.recordException(e as Error);
			span.end();
			throw e;
		}
	}

	private async requestViaCypressBridge<TReq, TRes>(
		subject: string,
		data: TReq,
		timeoutMs?: number
	): Promise<TRes | null> {
		const timeout = timeoutMs ?? 5000;
		const response = await this.cypressBridge!.request(subject, data, timeout);
		return response as TRes;
	}

	private getRequestDependencies(): {
		connection: NatsConnection;
		natsLib: NatsLib;
		codec: Codec<string>;
	} {
		if (!this.connection || !this.natsLib || !this.codec) {
			throw new Error('Not connected to NATS');
		}

		return {
			connection: this.connection,
			natsLib: this.natsLib,
			codec: this.codec
		};
	}

	private buildRequestHeaders(natsLib: NatsLib, inbox: string): ReturnType<NatsLib['headers']> {
		const natsHeaders = natsLib.headers();
		natsHeaders.append('reply_to', inbox);

		const traceHeaders: Record<string, string> = {};
		injectTraceContext(traceHeaders);
		for (const [key, value] of Object.entries(traceHeaders)) {
			natsHeaders.append(key, value);
		}

		return natsHeaders;
	}

	private async readRequestResponse<TRes>(
		sub: Subscription,
		codec: Codec<string>,
		subject: string
	): Promise<TRes> {
		for await (const msg of sub) {
			return JSON.parse(codec.decode(msg.data)) as TRes;
		}

		throw new Error(`Request to ${subject} timed out`);
	}

	/**
	 * Cleanup all resources
	 */
	destroy(): void {
		if (this.cypressBridge) {
			this.unsubscribeAll();
			this.cypressBridge = null;
			this.status = 'disconnected';
			this.lastError = null;
			this.reconnectListeners.clear();
			return;
		}

		this.unsubscribeAll();
		this.connection?.close();
		this.connection = null;
		this.status = 'disconnected';
		this.reconnectListeners.clear();
	}
}

export const nats = new NatsService();
