import { DiscordSDK, Events } from '@discord/embedded-app-sdk';

export interface DiscordInitResult {
	code: string;
	guildId: string | null;
	channelId: string | null;
}

// Lazily initialized — constructing DiscordSDK throws if `frame_id` query param
// is absent (i.e. outside a real Discord iframe). Deferring construction to
// initDiscord() lets tests inject window.__discordSdkStub before the SDK runs.
let _discordSdk: DiscordSDK | null = null;

function getDiscordSdk(): DiscordSDK {
	if (!_discordSdk) {
		const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string | undefined;
		if (!clientId) {
			throw new Error('VITE_DISCORD_CLIENT_ID is not set — cannot initialise Discord SDK');
		}
		_discordSdk = new DiscordSDK(clientId);
	}
	return _discordSdk;
}

function getActiveSdk(): DiscordSDK | Record<string, unknown> {
	if (typeof window !== 'undefined' && (window as any).__discordSdkStub) {
		return (window as any).__discordSdkStub;
	}
	return getDiscordSdk();
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
	]);
}

export async function initDiscord(): Promise<DiscordInitResult> {
	const sdk = getActiveSdk();

	await withTimeout(
		(sdk as DiscordSDK).ready(),
		8000,
		'Discord did not respond — close this Activity and try again from Discord'
	);

	const { code } = await (sdk as DiscordSDK).commands.authorize({
		client_id: import.meta.env.VITE_DISCORD_CLIENT_ID as string,
		response_type: 'code',
		scope: ['identify', 'guilds']
	});

	return {
		code,
		guildId: (sdk as DiscordSDK).guildId,
		channelId: (sdk as DiscordSDK).channelId
	};
}

export type ActivityParticipant = {
	discordId: string;
	username: string;
	avatar: string | null;
};

export function subscribeToParticipants(
	onUpdate: (participants: ActivityParticipant[]) => void
): () => void {
	const handler = (data: any) => {
		const participants: ActivityParticipant[] = (data?.participants ?? []).map(
			(p: { id: string; username: string; avatar?: string | null }) => ({
				discordId: p.id,
				username: p.username,
				avatar: p.avatar ?? null
			})
		);
		onUpdate(participants);
	};

	const sdk = getActiveSdk() as DiscordSDK;
	sdk.subscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, handler as any);
	return () => sdk.unsubscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, handler as any);
}
