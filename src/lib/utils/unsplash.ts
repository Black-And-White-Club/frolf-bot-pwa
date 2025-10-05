export function isUnsplashUrl(u: string | undefined) {
	return typeof u === 'string' && u.includes('images.unsplash.com');
}

// Build a safe srcset for Unsplash images that appends query params correctly
export function unsplashSrcset(u: string, widths: number[] = [48, 100]) {
	const hasQuery = u.includes('?');
	const sep = hasQuery ? '&' : '?';
	// Ensure we include auto=format to let the CDN pick modern formats
	return widths.map((w) => `${u}${sep}w=${w}&auto=format&fit=crop&q=60 ${w}w`).join(', ');
}

export function unsplashSizes(targetPx: number) {
	return `${targetPx}px`;
}
