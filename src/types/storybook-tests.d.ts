declare module '@storybook/testing-library' {
	export * from '@testing-library/dom';
}

declare module '@storybook/jest' {
	// re-export jest-like expect (loose typing)
	export const expect: unknown;
}
