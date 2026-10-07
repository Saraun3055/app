/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#280506',
        primary: '#7A1B1C',
        'primary-dark': '#5C1415',
        'primary-darker': '#420C0D',
        accent: '#D97706',
        secondary: '#FDF2F2',
        muted: '#FAF4F4',
        'muted-fg': '#786061',
        destructive: '#DC2626',
        border: 'rgba(122,27,28,0.12)',
      },
      fontFamily: {
        sans: ['Archivo_400Regular', 'Archivo_500Medium', 'Archivo_600SemiBold', 'Archivo_700Bold', 'System'],
        display: ['Sora_400Regular', 'Sora_600SemiBold', 'Sora_700Bold', 'System'],
        mono: ['JetBrainsMono_400Regular', 'JetBrainsMono_500Medium', 'JetBrainsMono_700Bold', 'System'],
      },
      borderRadius: {
        lg: '0.9rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
    },
  },
  plugins: [],
};
