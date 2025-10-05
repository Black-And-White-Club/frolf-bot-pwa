export function updateMetaThemeColor() {
	try {
		const meta = document.querySelector('meta[name="theme-color"]');
		if (!meta) return null;
		const val =
			getComputedStyle(document.documentElement).getPropertyValue('--guild-primary').trim() ||
			'#007474';
		meta.setAttribute('content', val);
		return val;
	} catch {
		return null;
	}
}
