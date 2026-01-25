/**
 * NATS Service Singleton
 * Central connection manager for Direct-to-NATS architecture
 */

import { connect, type NatsConnection, type Subscription, StringCodec } from 'nats.ws';
import { getTracer, injectTraceContext, createChildSpan } from '$lib/otel/tracing';
import { config, log } from '$lib/config';

// ============ Types ============

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface NatsMessage<T = unknown> {
	subject: string;
	data: T;
	headers?: Map<string, string[]>;
}

interface SubscriptionHandle {
	subject: string;
	unsubscribe: () => void;
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
	private codec = StringCodec();

	/**
	 * Connect to NATS server with JWT token
	 */
	async connect(token: string): Promise<void> {
		if (this.status === 'connecting' || this.status === 'connected') {
			return;
		}

		const tracer = getTracer();
		const span = tracer.startSpan('nats.connect', {
			attributes: { 'messaging.system': 'nats' }
		});

		this.status = 'connecting';
		this.lastError = null;

		try {
			this.connection = await connect({
				servers: config.nats.url,
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
		if (!this.connection) {
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
				const span = createChildSpan(
					`nats.receive.${subject}`,
					traceparent,
					{ 'messaging.system': 'nats', 'messaging.destination': subject }
				);

				try {
					const data = JSON.parse(this.codec.decode(msg.data)) as T;
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

	/**
	 * Publish a message to a NATS subject
	 */
	publish<T>(subject: string, data: T, headers?: Record<string, string>): void {
		if (!this.connection) {
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
			const natsHeaders = this.connection.headers();

			// Inject traceparent
			const traceHeaders: Record<string, string> = {};
			injectTraceContext(traceHeaders);

			// Add trace headers
			for (const [key, value] of Object.entries(traceHeaders)) {
				natsHeaders.append(key, value);
			}

			// Add custom headers
			if (headers) {
				for (const [key, value] of Object.entries(headers)) {
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
	 * Cleanup all resources
	 */
	destroy(): void {
		this.unsubscribeAll();
		this.connection?.close();
		this.connection = null;
		this.status = 'disconnected';
	}
}

export const nats = new NatsService();
