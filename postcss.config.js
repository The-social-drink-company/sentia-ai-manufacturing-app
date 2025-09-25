import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'

let tailwindPlugin

try {
  const plugin = await import('@tailwindcss/postcss')
  tailwindPlugin = plugin.default ?? plugin
} catch (error) {
  console.warn('[postcss] @tailwindcss/postcss not found; falling back to tailwindcss package')
  tailwindPlugin = tailwindcss
}

export default {
  plugins: [tailwindPlugin, autoprefixer]
}
