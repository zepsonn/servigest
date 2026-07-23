import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const ACCENTS = {
  verde:    { primary:'#1D9E75', primaryDark:'#0F6E56', primarySoft:'#E1F5EE' },
  azul:     { primary:'#2563EB', primaryDark:'#1E40AF', primarySoft:'#E6F1FB' },
  cobre:    { primary:'#C2712B', primaryDark:'#8A4E17', primarySoft:'#F7EBDD' },
  ameixa:   { primary:'#7C4DA8', primaryDark:'#543275', primarySoft:'#F0E9F7' },
  petroleo: { primary:'#146B72', primaryDark:'#0C4A4F', primarySoft:'#DFF0F1' },
  vinho:    { primary:'#9C3B4F', primaryDark:'#6E2637', primarySoft:'#F6E4E8' },
}

// lista usada pra montar o seletor de cores na interface (Layout)
export const ACCENT_LIST = [
  { key:'verde',    nome:'Verde Sinal',   hex:'#1D9E75' },
  { key:'azul',     nome:'Azul Elétrico', hex:'#2563EB' },
  { key:'cobre',    nome:'Cobre',         hex:'#C2712B' },
  { key:'ameixa',   nome:'Ameixa',        hex:'#7C4DA8' },
  { key:'petroleo', nome:'Petróleo',      hex:'#146B72' },
  { key:'vinho',    nome:'Vinho',         hex:'#9C3B4F' },
]

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('claro')      // claro | escuro | auto
  const [accent, setAccent] = useState('verde')  // chave em ACCENTS
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
    const timer = setInterval(resolve, 60000)
    return () => clearInterval(timer)
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
    // neutros quentes (nao cinza-morto)
    bg:        dark ? '#131210' : '#f6f5f2',
    bgCard:    dark ? '#1b1a17' : '#ffffff',
    bgSidebar: dark ? '#171613' : '#fbfaf7',
    bgInput:   dark ? '#201f1b' : '#ffffff',
    bgHover:   dark ? '#201f1b' : '#efede8',
    text:      dark ? '#f1efea' : '#1c1b18',
    textSoft:  dark ? '#a9a499' : '#6b675f',
    border:    dark ? '#2e2c27' : '#e3e0d9',
    borderSoft:dark ? '#24231f' : '#eceae4',
    // profundidade — usar em cards: boxShadow: t.shadow
    shadow:    dark ? '0 1px 2px rgba(0,0,0,.35), 0 14px 30px -16px rgba(0,0,0,.55)'
                    : '0 1px 2px rgba(28,27,24,.05), 0 10px 26px -14px rgba(28,27,24,.14)',
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
  if (!ctx) return { t: { dark:false, accent:'#1D9E75', accentDark:'#0F6E56', accentSoft:'#E1F5EE', bg:'#f6f5f2', bgCard:'#fff', bgSidebar:'#fbfaf7', bgInput:'#fff', bgHover:'#efede8', text:'#1c1b18', textSoft:'#6b675f', border:'#e3e0d9', borderSoft:'#eceae4', shadow:'0 1px 2px rgba(28,27,24,.05), 0 10px 26px -14px rgba(28,27,24,.14)' }, mode:'claro', accent:'verde', changeMode:()=>{}, changeAccent:()=>{} }
  return ctx
}
