export const load = async ({ fetch }) => {
	const response = await fetch('/api/auth/session');
	const session = await response.json();
	return { session };
};
