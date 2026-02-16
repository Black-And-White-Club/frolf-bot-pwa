/**
 * NATS Service Singleton
 * Central connection manager for Direct-to-NATS architecture
 */

import type { NatsConnection, Subscription, Codec } from 'nats.ws'; // Types only
import { getTracer, injectTraceContext, createChildSpan } from '$lib/otel/tracing';
import { config, log } from '$lib/config';

// ============ Types ============

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface NatsMessage<T = unknown> {
	subject: string;
	data: T;
	headers?: Map<string, string[]>;
}

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
	private natsLib: typeof import('nats.ws') | null = null;
	private reconnectListeners: Set<() => void | Promise<void>> = new Set();

	/**
	 * Connect to NATS server with JWT token
	 */
	async connect(token: string): Promise<void> {
		if (this.status === 'connecting' || this.status === 'connected') {
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

	/**
	 * Disconnect from NATS server
	 */
	async disconnect(): Promise<void> {
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
		if (!this.connection || !this.natsLib || !this.codec) {
			throw new Error('Not connected to NATS');
		}

		const timeout = options.timeout ?? 5000;
		const payload = this.codec.encode(JSON.stringify(data));

		const tracer = getTracer();
		const span = tracer.startSpan(`nats.request.${subject}`, {
			attributes: {
				'messaging.system': 'nats',
				'messaging.destination': subject
			}
		});

		// Create a unique inbox for this request
		const inbox = this.natsLib.createInbox();

		try {
			// Subscribe to the inbox for the response
			const sub = this.connection.subscribe(inbox, { max: 1, timeout });

			// Create headers with reply_to for JetStream compatibility
			const natsHeaders = this.natsLib.headers();
			natsHeaders.append('reply_to', inbox);

			// Inject trace context
			const traceHeaders: Record<string, string> = {};
			injectTraceContext(traceHeaders);
			for (const [key, value] of Object.entries(traceHeaders)) {
				natsHeaders.append(key, value);
			}

			// Publish the request with the reply_to header
			this.connection.publish(subject, payload, { headers: natsHeaders });

			// Wait for the response
			for await (const msg of sub) {
				const response = JSON.parse(this.codec.decode(msg.data)) as TRes;
				span.end();
				return response;
			}

			// If we get here, subscription timed out or no message received
			throw new Error(`Request to ${subject} timed out`);
		} catch (e) {
			span.recordException(e as Error);
			span.end();
			throw e;
		}
	}

	/**
	 * Cleanup all resources
	 */
	destroy(): void {
		this.unsubscribeAll();
		this.connection?.close();
		this.connection = null;
		this.status = 'disconnected';
		this.reconnectListeners.clear();
	}
}

export const nats = new NatsService();
