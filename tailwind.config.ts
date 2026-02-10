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
				// Brand: "Classic" Feel for Headlines
				display: ['Fraunces', 'serif'],
				// Brand: "Sport" Feel for Data
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
					950: '#081212'
				},
				'amethyst-aura': '#8B7BB8',
				forest: {
					50: '#ecfdf5',
					100: '#d1fae5',
					200: '#a7f3d0',
					300: '#6ee7b7',
					400: '#34d399',
					500: '#10b981',
					600: '#059669',
					700: '#047857',
					800: '#065f46',
					900: '#064e3b',
					950: '#022c22'
				},
				sage: {
					50: '#f6f7f6',
					100: '#e3e8e5',
					200: '#c5d3cd',
					300: '#a2b9b1',
					400: '#7a9f94',
					500: '#5c8476',
					600: '#4d7c5f',
					700: '#3d5646',
					800: '#33453b',
					900: '#2a3831',
					950: '#1a231f'
				}
			},

			// Gradients / backgrounds
			backgroundImage: {
				'guild-gold-gradient': 'linear-gradient(135deg, #b89b5e 45%, #7c6b3c 100%)',
				'liquid-skobeloff': 'linear-gradient(180deg, #008B8B 0%, #007474 100%)'
			},
			
			// Box Shadows
			boxShadow: {
				'aura': 'var(--guild-glow-aura, 0 0 15px rgba(139, 123, 184, 0.5))'
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
