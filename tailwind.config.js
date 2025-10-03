/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Custom Frolf Bot Theme Colors
				primary: {
					50: '#ecfdf5',
					100: '#d1fae5',
					500: '#10b981',
					600: '#059669'
				},
				secondary: {
					100: '#ccfbf1',
					500: '#14b8a6',
					700: '#0f766e'
				},
				accent: {
					100: '#cffafe',
					500: '#06b6d4'
				},
				// Override default grays to be more theme-appropriate
				gray: {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#0f172a'
				}
			}
		}
	},
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
