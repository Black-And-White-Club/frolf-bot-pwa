<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const navItems = [
		{ href: '/docs', label: 'Overview', exact: true },
		{ href: '/docs/getting-started', label: 'Getting Started' },
		{ href: '/docs/rounds', label: 'Rounds' },
		{ href: '/docs/scoring', label: 'Scoring' },
		{ href: '/docs/tags', label: 'Tags & Leaderboard' },
		{ href: '/docs/admin', label: 'Admin Reference' },
		{ href: '/docs/commands', label: 'Commands Reference' }
	];

	let mobileNavOpen = $state(false);

	function isActive(href: string, exact = false) {
		if (exact) return page.url.pathname === href;
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="flex min-h-full">
	<!-- Desktop sidebar -->
	<aside class="hidden w-56 shrink-0 border-r border-[var(--guild-border)] md:block">
		<div class="sticky top-0 px-3 py-8">
			<p
				class="mb-3 px-3 text-xs font-semibold tracking-widest text-[var(--guild-text-secondary)] uppercase"
			>
				Documentation
			</p>
			<nav aria-label="Documentation navigation">
				<ul class="space-y-0.5">
					{#each navItems as item}
						<li>
							<a
								href={item.href}
								class="block rounded-md px-3 py-2 text-sm transition-colors {isActive(
									item.href,
									item.exact
								)
									? 'bg-[var(--guild-primary)]/10 font-semibold text-[var(--guild-primary)]'
									: 'text-[var(--guild-text-secondary)] hover:bg-[var(--guild-surface-elevated,var(--guild-surface))] hover:text-[var(--guild-text)]'}"
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</aside>

	<!-- Content + mobile nav -->
	<div class="flex min-w-0 flex-1 flex-col">
		<!-- Mobile nav toggle -->
		<div class="border-b border-[var(--guild-border)] px-4 py-3 md:hidden">
			<button
				onclick={() => (mobileNavOpen = !mobileNavOpen)}
				class="flex w-full items-center justify-between text-sm font-medium text-[var(--guild-text)]"
				aria-expanded={mobileNavOpen}
				aria-controls="docs-mobile-nav"
			>
				<span>Docs Navigation</span>
				<svg
					class="h-4 w-4 transition-transform {mobileNavOpen ? 'rotate-180' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{#if mobileNavOpen}
				<nav id="docs-mobile-nav" class="mt-2" aria-label="Documentation navigation">
					<ul class="space-y-0.5 pb-2">
						{#each navItems as item}
							<li>
								<a
									href={item.href}
									onclick={() => (mobileNavOpen = false)}
									class="block rounded-md px-3 py-2 text-sm transition-colors {isActive(
										item.href,
										item.exact
									)
										? 'bg-[var(--guild-primary)]/10 font-semibold text-[var(--guild-primary)]'
										: 'text-[var(--guild-text-secondary)] hover:bg-[var(--guild-surface-elevated,var(--guild-surface))] hover:text-[var(--guild-text)]'}"
								>
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			{/if}
		</div>

		<!-- Page content -->
		<div class="px-6 py-8 md:px-10 md:py-10">
			<article class="docs-prose max-w-3xl">
				{@render children?.()}
			</article>
		</div>
	</div>
</div>

<style>
	:global(.docs-prose) {
		color: var(--guild-text);
		line-height: 1.75;
	}

	:global(.docs-prose h1) {
		font-family: var(--font-display, 'Fraunces', serif);
		font-size: 2rem;
		font-weight: 700;
		color: var(--guild-text);
		margin-bottom: 0.5rem;
		margin-top: 0;
		line-height: 1.2;
	}

	:global(.docs-prose h2) {
		font-family: var(--font-display, 'Fraunces', serif);
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--guild-text);
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--guild-border);
	}

	:global(.docs-prose h3) {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--guild-text);
		margin-top: 1.75rem;
		margin-bottom: 0.5rem;
	}

	:global(.docs-prose p) {
		margin-bottom: 1rem;
		color: var(--guild-text-secondary);
	}

	:global(.docs-prose strong) {
		color: var(--guild-text);
		font-weight: 600;
	}

	:global(.docs-prose a) {
		color: var(--guild-primary);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.docs-prose a:hover) {
		opacity: 0.8;
	}

	:global(.docs-prose ul),
	:global(.docs-prose ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}

	:global(.docs-prose li) {
		margin-bottom: 0.35rem;
		color: var(--guild-text-secondary);
	}

	:global(.docs-prose li strong) {
		color: var(--guild-text);
	}

	:global(.docs-prose code) {
		font-size: 0.875em;
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 4px;
		padding: 0.15em 0.4em;
		color: var(--guild-accent, #b89b5e);
		font-family: 'Space Grotesk', 'Fira Code', ui-monospace, monospace;
	}

	:global(.docs-prose pre) {
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 8px;
		padding: 1rem 1.25rem;
		overflow-x: auto;
		margin-bottom: 1.25rem;
	}

	:global(.docs-prose pre code) {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.875rem;
		color: var(--guild-text);
	}

	:global(.docs-prose blockquote) {
		border-left: 3px solid var(--guild-primary);
		padding-left: 1rem;
		margin-left: 0;
		color: var(--guild-text-secondary);
		font-style: italic;
	}

	:global(.docs-prose table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.25rem;
		font-size: 0.9rem;
	}

	:global(.docs-prose th) {
		text-align: left;
		padding: 0.5rem 0.75rem;
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		font-weight: 600;
		color: var(--guild-text);
	}

	:global(.docs-prose td) {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--guild-border);
		color: var(--guild-text-secondary);
		vertical-align: top;
	}

	:global(.docs-prose hr) {
		border: none;
		border-top: 1px solid var(--guild-border);
		margin: 2rem 0;
	}

	:global(.docs-prose .callout) {
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-left: 3px solid var(--guild-primary);
		border-radius: 6px;
		padding: 0.875rem 1rem;
		margin-bottom: 1.25rem;
	}

	:global(.docs-prose .callout p) {
		margin: 0;
	}
</style>
