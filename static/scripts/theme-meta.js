function updateMetaThemeColor() {
	try {
		const meta = document.querySelector('meta[name="theme-color"]');
		if (!meta) return;

		// Read the primary RGB token and mirror it into meta theme-color.
		const rgb = getComputedStyle(document.documentElement)
			.getPropertyValue('--guild-primary-rgb')
			.trim();

		if (rgb) {
			meta.setAttribute('content', 'rgb(' + rgb + ')');
			return;
		}

		if (document.documentElement.classList.contains('dark')) {
			meta.setAttribute('content', '#0f0f0f');
		} else {
			meta.setAttribute('content', '#007474');
		}
	} catch {
		// Ignore.
	}
}

window.addEventListener('load', function () {
	updateMetaThemeColor();
	const observer = new MutationObserver(updateMetaThemeColor);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['style', 'class']
	});
});
