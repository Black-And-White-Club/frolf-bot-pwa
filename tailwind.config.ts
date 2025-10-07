import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	darkMode: 'class', // Explicitly use .dark class for your theme toggle

	theme: {
		extend: {
			// Typography – use your self-hosted brand fonts
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'-apple-system',
					'Segoe UI',
					'Roboto',
					'Helvetica',
					'Arial',
					'sans-serif'
				],
				display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
				// alias used around the app as `font-secondary`
				secondary: ['Space Grotesk', 'system-ui', 'sans-serif'],
				// explicit accessibility-first stack (use where readability matters)
				accessible: ['Atkinson Hyperlegible', 'Inter', 'system-ui', 'sans-serif']
			},

			// Brand palette derived from your Guild CSS vars — now tokenized for both utility and var() usage
			colors: {
				// Semantic tokens tied to CSS vars
				guild: {
					primary: 'rgb(var(--guild-primary-rgb) / <alpha-value>)',
					secondary: 'rgb(var(--guild-secondary-rgb) / <alpha-value>)',
					accent: 'rgb(var(--guild-accent-rgb) / <alpha-value>)',
					text: 'rgb(var(--guild-text-rgb) / <alpha-value>)',
					'text-secondary': 'var(--guild-text-secondary)',
					border: 'var(--guild-border)',
					background: 'var(--guild-background)',
					surface: 'var(--guild-surface)',
					error: {
						bg: 'var(--guild-error-bg)',
						text: 'var(--guild-error-text)',
						border: 'var(--guild-error-border)'
					}
				},

				// Static fallbacks (for pre-theme rendering / Tailwind IntelliSense)
				primary: {
					DEFAULT: '#007474',
					50: '#ecfdf9',
					100: '#d1faf2',
					200: '#a7f3e8',
					300: '#6ee7d8',
					400: '#34d3c7',
					500: '#007474',
					600: '#006666',
					700: '#005555',
					800: '#004444',
					900: '#003333'
				},
				secondary: {
					DEFAULT: '#8B7BB8',
					50: '#f3f0ff',
					100: '#e9e5ff',
					200: '#d4ccff',
					300: '#b8a9ff',
					400: '#9c87ff',
					500: '#8B7BB8',
					600: '#7a6ba8',
					700: '#695b98',
					800: '#584b88',
					900: '#473b78'
				},
				accent: {
					DEFAULT: '#CBA135',
					50: '#fefce8',
					100: '#fef9c3',
					200: '#fef08a',
					300: '#fde047',
					400: '#facc15',
					500: '#CBA135',
					600: '#B38F2A',
					700: '#8F6E20',
					800: '#6b5a32',
					900: '#5a4928'
				},
				neutral: {
					DEFAULT: '#F5FFFA',
					50: '#F5FFFA',
					100: '#f0f9f6',
					200: '#e0f2ec',
					300: '#c7e9d7',
					400: '#9dd3b9',
					500: '#7cb899',
					600: '#5a9d79',
					700: '#4a7d61',
					800: '#3a5d49',
					900: '#2a3d31',
					950: '#1A1A1A'
				}
			},

			// Gradients / backgrounds
			backgroundImage: {
				'guild-gold-gradient': 'linear-gradient(135deg, #cba135 0%, #b38f2a 50%, #8f6e20 100%)'
			},

			// ⚡ Transition timing for subtle motion consistency
			transitionTimingFunction: {
				theme: 'ease-in-out'
			}
		}
	},

	plugins: [
		forms,
		typography,

		// Custom plugin for guild utilities (mirrors your CSS but in Tailwind)
		plugin(({ addUtilities }) => {
			addUtilities({
				'.text-guild-gradient': {
					background: 'var(--guild-gold-gradient)',
					'-webkit-background-clip': 'text',
					'-webkit-text-fill-color': 'transparent',
					'background-clip': 'text'
				},
				// Gold gradient specifically used by the leaderboard top-rank styles
				'.text-guild-gold-gradient': {
					background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
					'-webkit-background-clip': 'text',
					'-webkit-text-fill-color': 'transparent',
					'background-clip': 'text'
				},
				'.bg-guild-surface-elevated': {
					backgroundColor: 'var(--guild-surface-elevated, var(--guild-surface))',
					transition: 'background-color 180ms ease'
				},
				'.participant-avatar': {
					borderWidth: '2px',
					borderStyle: 'solid',
					transition: 'background-color 180ms ease, border-color 180ms ease'
				},
				// Reusable padding utility for right-hand inner controls (uses CSS token)
				'.pr-inner-controls': {
					paddingRight: 'var(--inner-controls-offset, 2rem)'
				}
			});
		})
	]
};
