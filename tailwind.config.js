/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          ...require('daisyui/src/colors/themes')['[data-theme=corporate]'],
          "--rounded-box": "0.5rem"
        },
      },
    ],
  },
}

