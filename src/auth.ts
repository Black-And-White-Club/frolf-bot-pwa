import { SvelteKitAuth } from '@auth/sveltekit';
import Discord from '@auth/sveltekit/providers/discord';
import type { Provider } from '@auth/sveltekit/providers';
import { dev } from '$app/environment';


import type { Handle, RequestEvent, ResolveOptions } from '@sveltejs/kit';
type MaybePromise<T> = T | Promise<T>;
let handle: Handle;
type AuthReturn = ReturnType<typeof SvelteKitAuth>;
let signIn: AuthReturn['signIn'] | undefined;
let signOut: AuthReturn['signOut'] | undefined;

if (
       dev ||
       !process.env.DISCORD_CLIENT_ID ||
       !process.env.DISCORD_CLIENT_SECRET
){
       // Mock handle for local/dev
       handle = (async function mockHandle({ event, resolve }: { event: RequestEvent; resolve: (event: RequestEvent, opts?: ResolveOptions) => MaybePromise<Response> }) {
	       if (event?.url?.pathname === '/api/auth/session') {
		       return new Response(
			       JSON.stringify({
				       user: {
					       id: 'mock-user-id',
					       name: 'Mock User',
					       email: 'mock@example.com',
					       image: 'https://i.pravatar.cc/150?img=1'
				       },
				       expires: '2099-12-31T23:59:59.999Z'
			       }),
			       {
				       status: 200,
				       headers: { 'Content-Type': 'application/json' }
			       }
		       );
	       }
	       return resolve(event);
       }) as Handle;
	signIn = () => {};
	signOut = () => {};
} else {
       // Real auth for production
       const auth = SvelteKitAuth({
	       providers: [
		       Discord({
			       clientId: process.env.DISCORD_CLIENT_ID!,
			       clientSecret: process.env.DISCORD_CLIENT_SECRET!
		       })
	       ] as Provider[],
	       pages: {
		       signIn: '/auth/signin',
		       error: '/auth/error'
	       }
       });
       handle = auth.handle;
       signIn = auth.signIn;
       signOut = auth.signOut;
}

export { handle, signIn, signOut };
export const authjs = handle;
