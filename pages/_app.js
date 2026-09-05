import '../styles/globals.css'
import { ThemeProvider } from '../lib/theme'
import { Plus_Jakarta_Sans } from 'next/font/google'

// next/font ja vem no Next 14 — nao instala nada e a fonte fica hospedada
// junto com o site (carrega rapido e nao "pula" na hora que abre).
const fonte = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--fonte-sg',
})

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <style jsx global>{`
        :root { --fonte-sg: ${fonte.style.fontFamily}; }
        html, body, input, textarea, select, button {
          font-family: ${fonte.style.fontFamily}, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
      <div className={fonte.className}>
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  )
}
