/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
	  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
	  "./components/**/*.{js,ts,jsx,tsx,mdx}",
	  "./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
	  extend: {
		colors: {
		  black: '#000000',
		  emerald: '#50C878',
		  blush: '#F4C2C2',
		  cream: '#FFFDD0',
		  background: 'var(--background)',
		  foreground: 'var(--foreground)',
		  card: {
			DEFAULT: 'var(--card)',
			foreground: 'var(--card-foreground)'
		  },
		  popover: {
			DEFAULT: 'var(--popover)',
			foreground: 'var(--popover-foreground)'
		  },
		  primary: {
			DEFAULT: 'var(--primary)',
			foreground: 'var(--primary-foreground)'
		  },
		  secondary: {
			DEFAULT: 'var(--secondary)',
			foreground: 'var(--secondary-foreground)'
		  },
		  muted: {
			DEFAULT: 'var(--muted)',
			foreground: 'var(--muted-foreground)'
		  },
		  accent: {
			DEFAULT: 'var(--accent)',
			foreground: 'var(--accent-foreground)'
		  }
		}
	  }
	},
	plugins: [require("tailwindcss-animate")]
  };