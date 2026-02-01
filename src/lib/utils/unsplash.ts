export function isUnsplashUrl(u: string | undefined) {
	return typeof u === 'string' && u.includes('images.unsplash.com');
}

// Build a safe srcset for Unsplash images that appends query params correctly
export function unsplashSrcset(u: string, widths: number[] = [48, 100], format?: 'webp' | 'avif') {
	const hasQuery = u.includes('?');
	const sep = hasQuery ? '&' : '?';
	// Include auto=format to allow the CDN to negotiate formats. If a specific
	// format is requested, set fm=<format> to force that output (used in <picture>
	// source tags for AVIF/WebP fallbacks).
	const fmtPart = format ? `&fm=${format}` : '&auto=format';
	return widths.map((w) => `${u}${sep}w=${w}&fit=crop&q=60${fmtPart} ${w}w`).join(', ');
}

export function unsplashSizes(targetPx: number) {
	return `${targetPx}px`;
}
