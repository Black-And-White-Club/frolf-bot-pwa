import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				// Use self-hosted Inter for UI and Space Grotesk for display headings
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
				display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif']
			},
			colors: {
				// Frolf-Bot Brand Colors
				primary: {
					50: '#ecfdf9', // Very light Skobeloff
					100: '#d1faf2', // Light Skobeloff
					200: '#a7f3e8', // Lighter Skobeloff
					300: '#6ee7d8', // Light-medium Skobeloff
					400: '#34d3c7', // Medium Skobeloff
					500: '#007474', // Skobeloff (Brand Hero)
					600: '#006666', // Darker Skobeloff
					700: '#005555', // Even darker Skobeloff
					800: '#004444', // Very dark Skobeloff
					900: '#003333' // Deepest Skobeloff
				},
				secondary: {
					50: '#f3f0ff', // Very light Amethyst
					100: '#e9e5ff', // Light Amethyst
					200: '#d4ccff', // Lighter Amethyst
					300: '#b8a9ff', // Light-medium Amethyst
					400: '#9c87ff', // Medium Amethyst
					500: '#8B7BB8', // Amethyst (Support/Highlight)
					600: '#7a6ba8', // Darker Amethyst
					700: '#695b98', // Even darker Amethyst
					800: '#584b88', // Very dark Amethyst
					900: '#473b78' // Deepest Amethyst
				},
				accent: {
					50: '#fefce8', // Very light Gold
					100: '#fef9c3', // Light Gold
					200: '#fef08a', // Lighter Gold
					300: '#fde047', // Light-medium Gold
					400: '#facc15', // Medium Gold
					500: '#CBA135', // Satin Sheen Gold (Brand Accent)
					600: '#B38F2A', // Darker Gold (gradient stop)
					700: '#8F6E20', // Even darker Gold (gradient stop)
					800: '#6b5a32', // Very dark Gold
					900: '#5a4928' // Deepest Gold
				},
				// Neutral Colors - Mint Cream & Deep Charcoal
				neutral: {
					50: '#F5FFFA', // Mint Cream (Light Neutral)
					100: '#f0f9f6',
					200: '#e0f2ec',
					300: '#c7e9d7',
					400: '#9dd3b9',
					500: '#7cb899',
					600: '#5a9d79',
					700: '#4a7d61',
					800: '#3a5d49',
					900: '#2a3d31',
					950: '#1A1A1A' // Deep Charcoal (Dark Neutral)
				}
			}
		}
	},
	plugins: [forms, typography]
};
