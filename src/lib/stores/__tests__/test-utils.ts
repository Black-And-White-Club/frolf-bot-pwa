export function resetModuleAndDom() {
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.clear();
		} catch {
			// some tests replace localStorage; ignore errors
		}
		document.documentElement.className = '';
		document.documentElement.style.cssText = '';
	}
}
