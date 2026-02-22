export type ViewportName = 'desktop' | 'phone' | 'tablet' | 'tvPortrait';

export type ViewportProfile = {
	name: ViewportName;
	width: number;
	height: number;
};

export const VIEWPORT_MATRIX: readonly ViewportProfile[] = [
	{ name: 'desktop', width: 1280, height: 720 },
	{ name: 'phone', width: 393, height: 852 },
	{ name: 'tablet', width: 820, height: 1180 },
	{ name: 'tvPortrait', width: 1080, height: 1920 }
] as const;

export const DESKTOP_VIEWPORT: ViewportProfile = VIEWPORT_MATRIX[0];

export function viewportConfig(profile: ViewportProfile): string {
	return `viewportWidth=${profile.width},viewportHeight=${profile.height}`;
}
