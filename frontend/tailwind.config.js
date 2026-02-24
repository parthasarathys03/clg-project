/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeInUp 0.55s ease-out both',
        'fade-in':    'fadeIn 0.4s ease-out both',
        'slide-left': 'slideInLeft 0.4s ease-out both',
        'scale-in':   'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'float':      'float 3.5s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s linear infinite',
        'gradient':   'gradientShift 5s ease infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'bounce-in':  'bounceIn 0.65s cubic-bezier(0.68,-0.55,0.27,1.55) both',
        'spin-slow':  'spin 10s linear infinite',
        'ring-pulse': 'ringPulse 1.8s ease-out infinite',
        'slide-up':   'slideUp 0.4s ease-out both',
        'count':      'fadeIn 0.3s ease-out both',
      },
      keyframes: {
        fadeInUp:      { from: { opacity: '0', transform: 'translateY(28px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:        { from: { opacity: '0' }, to: { opacity: '1' } },
        slideInLeft:   { from: { opacity: '0', transform: 'translateX(-24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:       { from: { opacity: '0', transform: 'scale(0.88)' }, to: { opacity: '1', transform: 'scale(1)' } },
        float:         { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer:       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        gradientShift: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        pulseGlow:     {
          '0%,100%': { boxShadow: '0 0 8px rgba(139,92,246,0.4), 0 0 0px rgba(139,92,246,0)' },
          '50%':     { boxShadow: '0 0 30px rgba(139,92,246,0.8), 0 0 60px rgba(139,92,246,0.2)' },
        },
        bounceIn:      { '0%': { opacity: '0', transform: 'scale(0.3)' }, '50%': { transform: 'scale(1.08)' }, '70%': { transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        ringPulse:     { '0%': { transform: 'scale(1)', opacity: '0.7' }, '100%': { transform: 'scale(2)', opacity: '0' } },
        slideUp:       { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(139,92,246,0.4)',
        'glow-green':  '0 0 25px rgba(16,185,129,0.35)',
        'glow-red':    '0 0 25px rgba(239,68,68,0.35)',
        'glow-amber':  '0 0 25px rgba(245,158,11,0.35)',
        'glow-blue':   '0 0 25px rgba(59,130,246,0.35)',
        'card':        '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.14)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
}
