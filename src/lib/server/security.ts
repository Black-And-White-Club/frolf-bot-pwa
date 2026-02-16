export function hasTrustedOrigin(request: Request, expectedOrigin: string): boolean {
	const origin = request.headers.get('origin');
	if (origin) {
		return origin === expectedOrigin;
	}

	const referer = request.headers.get('referer');
	if (!referer) {
		return false;
	}

	try {
		return new URL(referer).origin === expectedOrigin;
	} catch {
		return false;
	}
}

export function makeRequestId(): string {
	return crypto.randomUUID();
}
