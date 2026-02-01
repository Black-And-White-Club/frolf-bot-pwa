export function stubAnchorClick() {
	const origCreateElement = document.createElement.bind(document);
	document.createElement = ((tagName: string) => {
		if (tagName.toLowerCase() === 'a') {
			const a = origCreateElement('a') as HTMLAnchorElement;
			a.href = '';
			a.download = '';
			a.click = () => {
				/* noop to avoid jsdom navigation */
			};
			return a;
		}
		return origCreateElement(tagName as unknown as string);
	}) as unknown as typeof document.createElement;

	return function restore() {
		document.createElement = origCreateElement;
	};
}
