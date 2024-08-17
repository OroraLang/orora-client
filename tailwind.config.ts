import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'left-to-center': 'leftToCenter 0.5s',
        'left-to-right': 'leftToRight 0.5s',
        'center-to-left': 'centerToLeft 0.5s',
        'center-to-right': 'centerToRight 0.5s',
        'right-to-left': 'rightToLeft 0.5s',
        'right-to-center': 'rightToCenter 0.5s',
      },
      keyframes: {
        leftToCenter: {
          from: { left: '3px' },
          to: { left: '85px' },
        },
        leftToRight: {
          from: { left: '3px' },
          to: { left: '167px' },
        },
        centerToLeft: {
          from: { left: '85px' },
          to: { left: '3px' },
        },
        centerToRight: {
          from: { left: '85px' },
          to: { right: '1px' },
        },
        rightToLeft: {
          from: { left: '167px' },
          to: { left: '3px' },
        },
        rightToCenter: {
          from: { left: '167px' },
          to: { right: '85px' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
    fontFamily: {
      cmu: ['font-cmu', 'serif'],
    },
  },
  plugins: [],
};
export default config;
