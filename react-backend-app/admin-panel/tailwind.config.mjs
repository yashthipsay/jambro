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
		  "primary-purple": "#8059f7",
		  "secondary-purple": "#6434fc",
		  "light-purple": "#dcd5ff",
		  "accent-pink": "#FFCCF2",
		  background: "var(--background)",
		  foreground: "var(--foreground)",
		  card: {
			DEFAULT: "var(--card)",
			foreground: "var(--card-foreground)",
		  },
		  popover: {
			DEFAULT: "var(--popover)",
			foreground: "var(--popover-foreground)",
		  },
		  primary: {
			DEFAULT: "var(--primary)",
			foreground: "var(--primary-foreground)",
		  },
		  secondary: {
			DEFAULT: "var(--secondary)",
			foreground: "var(--secondary-foreground)",
		  },
		  accent: {
			DEFAULT: "var(--accent)",
			foreground: "var(--accent-foreground)",
		  },
		  muted: {
			DEFAULT: "var(--muted)",
			foreground: "var(--muted-foreground)",
		  },
		},
		fontFamily: {
		  audiowide: ["Audiowide", "cursive"],
		  syncopate: ["Syncopate", "sans-serif"],
		  montserrat: ["Montserrat", "sans-serif"],
		},
		backgroundImage: {
		  "gradient-1": "var(--gradient-1)",
		  "gradient-2": "var(--gradient-2)",
		  "gradient-3": "var(--gradient-3)",
		},
		boxShadow: {
		  glass: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
		},
		borderRadius: {
		  custom: "var(--radius)",
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  }
  
  