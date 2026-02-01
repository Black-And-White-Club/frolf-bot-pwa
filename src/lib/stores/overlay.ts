import { writable } from 'svelte/store';

// modalOpen indicates whether an overlay/modal that should hide background
// content is currently open. Components (Navbar/HamburgerMenu) set this and
// layout subscribes to apply aria-hidden to the main content.
export const modalOpen = writable(false);

export function setModalOpen(v: boolean) {
	modalOpen.set(!!v);
}

export default modalOpen;
