<script lang="ts">
	import { browser } from '$app/environment';
	import { log } from '$lib/config';

	let deferredPrompt: BeforeInstallPromptEvent | null = $state(null);
	let showPrompt = $state(false);

	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	$effect(() => {
		if (!browser) return;

		const handler = (e: Event) => {
			log('[PWA] beforeinstallprompt event fired');
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
			showPrompt = true;
		};

		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	});

	async function handleInstall() {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			showPrompt = false;
		}
		deferredPrompt = null;
	}

	function handleDismiss() {
		showPrompt = false;
		// Don't show again this session
		sessionStorage.setItem('pwa-prompt-dismissed', 'true');
	}
</script>

{#if showPrompt && !sessionStorage.getItem('pwa-prompt-dismissed')}
	<div class="install-prompt">
		<div class="prompt-content">
			<span class="prompt-icon">📲</span>
			<div class="prompt-text">
				<strong>Install Frolf Bot</strong>
				<span>Add to your home screen for quick access</span>
			</div>
		</div>
		<div class="prompt-actions">
			<button class="btn-dismiss" onclick={handleDismiss}>Not now</button>
			<button class="btn-install" onclick={handleInstall}>Install</button>
		</div>
	</div>
{/if}

<style>
	.install-prompt {
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		right: 1rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		z-index: 1000;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.prompt-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.prompt-icon {
		font-size: 1.5rem;
	}

	.prompt-text {
		display: flex;
		flex-direction: column;
		font-size: 0.875rem;
	}

	.prompt-text strong {
		color: var(--guild-text, #f5fffa);
		font-family: 'Fraunces', serif;
	}

	.prompt-text span {
		color: var(--guild-text-secondary, #9ca3af);
		font-family: 'Space Grotesk', sans-serif;
	}

	.prompt-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.btn-dismiss {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		color: var(--guild-text-secondary, #9ca3af);
		cursor: pointer;
		font-family: 'Space Grotesk', sans-serif;
	}

	.btn-install {
		padding: 0.5rem 1rem;
		border: none;
		background: linear-gradient(180deg, #008b8b 0%, #007474 100%);
		color: white;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		font-family: 'Space Grotesk', sans-serif;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	@media (min-width: 640px) {
		.install-prompt {
			left: auto;
			right: 1rem;
			max-width: 20rem;
		}
	}
</style>
