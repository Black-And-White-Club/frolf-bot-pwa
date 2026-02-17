(function () {
	try {
		// Prefer the canonical persisted key used by the theme system.
		const prefers = localStorage.getItem('frolf:prefers_dark');
		if (prefers === '1') {
			document.documentElement.classList.add('dark');
			return;
		}
		if (prefers === '0') {
			document.documentElement.classList.remove('dark');
			return;
		}

		// Fallback to legacy 'theme' key for compatibility.
		const legacy = localStorage.getItem('theme');
		if (legacy === 'dark') {
			document.documentElement.classList.add('dark');
		} else if (legacy === 'light') {
			document.documentElement.classList.remove('dark');
		} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.documentElement.classList.add('dark');
		}
	} catch {
		// Ignore (private mode may throw).
	}
})();
