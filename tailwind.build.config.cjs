module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        cognizantBlue: '#0070D2',
        cognizantDark: '#0B1F33',
        colorCognizantStdBlue: '#2E308E', // added missing '#'
        colorCognizantCyan: '#06C7CC'     // added missing '#'
      },
      fontFamily: {
        gellix: ['Gellix', 'sans-serif']
      }
    }
  },
  plugins: []
};
