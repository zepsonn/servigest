import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const ACCENTS = {
  verde: { primary:'#1D9E75', primaryDark:'#0F6E56', primarySoft:'#E1F5EE' },
  azul:  { primary:'#2563EB', primaryDark:'#1E40AF', primarySoft:'#E6F1FB' },
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('claro')      // claro | escuro | auto
  const [accent, setAccent] = useState('verde')  // verde | azul
  const [resolved, setResolved] = useState('claro')

  // carregar preferencia salva no dispositivo
  useEffect(() => {
    const m = localStorage.getItem('servigest_tema_mode') || 'claro'
    const a = localStorage.getItem('servigest_tema_accent') || 'verde'
    setMode(m); setAccent(a)
  }, [])

  // resolver tema (auto segue horario: 18h-6h = escuro)
  useEffect(() => {
    function resolve() {
      if (mode === 'auto') {
        const h = new Date().getHours()
        setResolved(h >= 18 || h < 6 ? 'escuro' : 'claro')
      } else {
        setResolved(mode)
      }
    }
    resolve()
    const t = setInterval(resolve, 60000)
    return () => clearInterval(t)
  }, [mode])

  function changeMode(m) { setMode(m); localStorage.setItem('servigest_tema_mode', m) }
  function changeAccent(a) { setAccent(a); localStorage.setItem('servigest_tema_accent', a) }

  const dark = resolved === 'escuro'
  const ac = ACCENTS[accent] || ACCENTS.verde

  const t = {
    dark,
    accent: ac.primary,
    accentDark: ac.primaryDark,
    accentSoft: ac.primarySoft,
    bg:        dark ? '#0f1115' : '#f5f5f3',
    bgCard:    dark ? '#181b21' : '#ffffff',
    bgSidebar: dark ? '#13161b' : '#fafaf8',
    bgInput:   dark ? '#1f242c' : '#ffffff',
    bgHover:   dark ? '#1f242c' : '#fafaf8',
    text:      dark ? '#e8eaed' : '#1a1a1a',
    textSoft:  dark ? '#9aa0a8' : '#888888',
    border:    dark ? '#2a2f37' : '#e8e8e8',
    borderSoft:dark ? '#23272e' : '#f0f0f0',
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, resolved, t, changeMode, changeAccent }}>
      <div style={{ background: t.bg, minHeight:'100vh', color: t.text }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { t: { dark:false, accent:'#1D9E75', accentDark:'#0F6E56', accentSoft:'#E1F5EE', bg:'#f5f5f3', bgCard:'#fff', bgSidebar:'#fafaf8', bgInput:'#fff', bgHover:'#fafaf8', text:'#1a1a1a', textSoft:'#888', border:'#e8e8e8', borderSoft:'#f0f0f0' }, mode:'claro', accent:'verde', changeMode:()=>{}, changeAccent:()=>{} }
  return ctx
}
