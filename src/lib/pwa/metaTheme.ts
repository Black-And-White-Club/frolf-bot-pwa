export function updateMetaThemeColor() {
	try {
		const meta = document.querySelector('meta[name="theme-color"]');
		if (!meta) return null;
		// Prefer the RGB token (e.g. "0 116 116") — used by theme helpers.
		const rgbToken = getComputedStyle(document.documentElement)
			.getPropertyValue('--guild-primary-rgb')
			.trim();
		if (rgbToken) {
			const val = `rgb(${rgbToken})`;
			meta.setAttribute('content', val);
			return val;
		}

		// Backwards-compatible: some places (and tests) set --guild-primary as a hex value.
		const primary = getComputedStyle(document.documentElement)
			.getPropertyValue('--guild-primary')
			.trim();
		if (primary) {
			// Convert hex (#rrggbb or #rgb) to rgb(r,g,b)
			const hex = primary.replace(/"|'/g, '').trim();
			const toRgb = (h: string) => {
				const clean = h.replace('#', '');
				if (clean.length === 3) {
					return clean
						.split('')
						.map((c) => c + c)
						.map((pair) => parseInt(pair, 16));
				}
				if (clean.length === 6) {
					return [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map((p) =>
						parseInt(p, 16)
					);
				}
				return null;
			};
			const rgbArr = toRgb(hex);
			if (rgbArr) {
				const val = `rgb(${rgbArr.join(',')})`;
				meta.setAttribute('content', val);
				return val;
			}
		}

		// Final fallback
		const fallback = document.documentElement.classList.contains('dark') ? '#0f0f0f' : '#007474';
		meta.setAttribute('content', fallback);
		return fallback;
	} catch {
		return null;
	}
}
