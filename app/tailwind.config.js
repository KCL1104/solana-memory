/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ── Font Families ── */
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      
      /* ── Colors ── */
      colors: {
        /* Neon Palette */
        'neon': {
          orange: '#ff3d00',
          cyan: '#00f0ff',
          pink: '#ff006e',
          purple: '#8338ec',
          yellow: '#ffbe0b',
          green: '#06ffa5',
        },
        /* Dark Theme */
        'dark': {
          bg: '#050508',
          card: '#0d0d12',
          hover: '#16161f',
          border: '#1a1a25',
        },
        /* Semantic Colors */
        cyber: {
          primary: 'var(--neon-orange)',
          secondary: 'var(--neon-cyan)',
          accent: 'var(--neon-pink)',
          success: 'var(--neon-green)',
          warning: 'var(--neon-yellow)',
        },
        /* Theme-aware colors */
        theme: {
          bg: {
            primary: 'var(--bg-primary)',
            secondary: 'var(--bg-secondary)',
            tertiary: 'var(--bg-tertiary)',
            card: 'var(--bg-card)',
            hover: 'var(--bg-hover)',
          },
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
            muted: 'var(--text-muted)',
            disabled: 'var(--text-disabled)',
          },
          border: {
            primary: 'var(--border-primary)',
            hover: 'var(--border-hover)',
            accent: 'var(--border-accent)',
          },
        },
      },
      
      /* ── Animations ── */
      animation: {
        /* Core animations */
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'border-flow': 'borderFlow 4s ease infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'slide-up': 'slideInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'fade-scale': 'fadeInScale 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'neon-flicker': 'neonFlicker 3s infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        /* Stagger delays */
        'delay-100': '100ms',
        'delay-200': '200ms',
        'delay-300': '300ms',
        'delay-400': '400ms',
        'delay-500': '500ms',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(1deg)' },
          '50%': { transform: 'translateY(-5px) rotate(0deg)' },
          '75%': { transform: 'translateY(-15px) rotate(-1deg)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            opacity: '1',
            filter: 'brightness(1)',
          },
          '50%': { 
            opacity: '0.8',
            filter: 'brightness(1.2)',
          },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        slideInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInScale: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            opacity: '1',
            textShadow: '0 0 5px #ff3d00, 0 0 10px #ff3d00, 0 0 20px #ff3d00, 0 0 40px #ff3d00',
          },
          '20%, 24%, 55%': {
            opacity: '0.8',
            textShadow: 'none',
          },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      
      /* ── Box Shadow ── */
      boxShadow: {
        'neon-orange': '0 0 5px rgba(255, 61, 0, 0.5), 0 0 15px rgba(255, 61, 0, 0.3), 0 0 30px rgba(255, 61, 0, 0.1)',
        'neon-cyan': '0 0 5px rgba(0, 240, 255, 0.5), 0 0 15px rgba(0, 240, 255, 0.3), 0 0 30px rgba(0, 240, 255, 0.1)',
        'neon-pink': '0 0 5px rgba(255, 0, 110, 0.5), 0 0 15px rgba(255, 0, 110, 0.3), 0 0 30px rgba(255, 0, 110, 0.1)',
        'neon-purple': '0 0 5px rgba(131, 56, 236, 0.5), 0 0 15px rgba(131, 56, 236, 0.3), 0 0 30px rgba(131, 56, 236, 0.1)',
        'neon-green': '0 0 5px rgba(6, 255, 165, 0.5), 0 0 15px rgba(6, 255, 165, 0.3), 0 0 30px rgba(6, 255, 165, 0.1)',
        'card': '0 10px 40px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 20px 60px rgba(0, 0, 0, 0.5)',
      },
      
      /* ── Backdrop Blur ── */
      backdropBlur: {
        'xs': '2px',
      },
      
      /* ── Transition Timing ── */
      transitionTimingFunction: {
        'cyber': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'glitch': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      
      /* ── Clip Paths ── */
      clipPath: {
        'slant': 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
        'notch': 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px))',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
