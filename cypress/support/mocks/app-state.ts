type MockSession = {
	user?: {
		name?: string;
	};
} | null;

type MockPageState = {
	data: {
		session: MockSession;
	};
	url: URL;
};

const defaultState: MockPageState = {
	data: {
		session: null
	},
	url: new URL('http://localhost/')
};

export const page: MockPageState = {
	data: {
		session: defaultState.data.session
	},
	url: new URL(defaultState.url.href)
};

export function setMockPageState({
	session,
	pathname,
	href
}: {
	session?: MockSession;
	pathname?: string;
	href?: string;
} = {}): void {
	if (session !== undefined) {
		page.data.session = session;
	}

	if (href) {
		page.url = new URL(href);
		return;
	}

	if (pathname) {
		page.url = new URL(pathname, page.url.origin);
	}
}

export function resetMockPageState(): void {
	page.data.session = defaultState.data.session;
	page.url = new URL(defaultState.url.href);
}
