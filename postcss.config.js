// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      tailwindConfig: './tailwind.config.js'
    },
    autoprefixer: {},
  }
}