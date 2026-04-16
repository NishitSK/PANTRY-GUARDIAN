import type { Config } from 'tailwindcss'

export default {
	darkMode: ["class"],
	content: [
		'./app/**/*.{ts,tsx,js,jsx}',
		'./components/**/*.{ts,tsx,js,jsx}',
		'./lib/**/*.{ts,tsx,js,jsx}'
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
				surface: "hsl(var(--surface))",
				textMain: "hsl(var(--text-main))",
				textMuted: "hsl(var(--text-muted))",
				gold: "hsl(var(--primary))",
				'gold-warm': "hsl(var(--primary-strong))",
				olive: "hsl(var(--accent))",
        brutalist: {
          yellow: '#FFD600',
          cyan: '#00E0FF',
          magenta: '#FF00F5',
          black: '#000000',
          white: '#F4F4F4',
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
				'olive-mesh': 'radial-gradient(circle at 10% 20%, rgba(121, 150, 39, 0.18) 0%, transparent 35%), radial-gradient(circle at 90% 80%, rgba(0, 0, 0, 0.08) 0%, transparent 30%)',
				'brutal-grid': 'linear-gradient(90deg, rgba(0,0,0,0.10) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.10) 1px, transparent 1px)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'gold-glow': '0 0 20px 0 rgba(212, 175, 55, 0.2)',
				'brutal': '6px 6px 0 0 rgba(0, 0, 0, 0.95)',
				'brutal-lg': '10px 10px 0 0 rgba(0, 0, 0, 0.95)',
      },
      backdropBlur: {
        'glass': '16px',
      },
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
      fontFamily: {
				sans: ["var(--font-ibm-mono)", "var(--font-manrope)", "sans-serif"],
				display: ["var(--font-anton)", "var(--font-outfit)", "sans-serif"],
				serif: ["var(--font-noto-serif)", "var(--font-fraunces)", "serif"],
        'noto-serif': ["var(--font-noto-serif)", "serif"],
        'manrope': ["var(--font-manrope)", "sans-serif"],
				'anton': ["var(--font-anton)", "sans-serif"],
				'ibm-mono': ["var(--font-ibm-mono)", "monospace"],
      },
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"spin-slow": {
					from: { transform: "rotate(0deg)" },
					to: { transform: "rotate(360deg)" },
				}
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"spin-slow": "spin-slow 20s linear infinite",
			},
		}
	},
	plugins: [require("tailwindcss-animate")]
} satisfies Config

