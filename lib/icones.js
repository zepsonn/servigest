/**
 * Icones minimalistas (traco, sem preenchimento) usados no sistema todo.
 * Substituem os emojis dos botoes — mesma linguagem visual em toda tela.
 *
 *   <Ico n="editar"/>            icone solto
 *   <BotaoIco n="apagar" t={t} tom="perigo" onClick={...} titulo="Apagar"/>
 */
import { useState } from 'react'

const P = {
  editar:    <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
  apagar:    <><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
  recibo:    <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
  copiar:    <><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  whatsapp:  <><path d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.2-1.4A10 10 0 1 0 12 2z"/><path d="M8.5 9c0 4 3 6.5 6.5 6.5"/></>,
  confirmar: <><path d="M20 6L9 17l-5-5"/></>,
  fechar:    <><path d="M18 6L6 18M6 6l12 12"/></>,
  mais:      <><path d="M12 5v14M5 12h14"/></>,
  dinheiro:  <><circle cx="12" cy="12" r="9"/><path d="M15 9.5a2.4 2.4 0 0 0-2.6-1.5c-1.3 0-2.4.8-2.4 1.9 0 2.6 5 1.3 5 3.9 0 1.1-1.1 1.9-2.4 1.9A2.6 2.6 0 0 1 9 14.2"/><path d="M12 6.2v1.5M12 16.3v1.5"/></>,
  busca:     <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
  calendario:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  caixa:     <><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v9"/></>,
  alerta:    <><path d="M12 3l9 16H3l9-16z"/><path d="M12 9v5M12 17.5v.01"/></>,
  voltar:    <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
  imprimir:  <><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/></>,
  olho:      <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  negrito:   <><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/></>,
  italico:   <><path d="M19 4h-9M14 20H5M15 4L9 20"/></>,
  riscado:   <><path d="M4 12h16"/><path d="M17 7a4 4 0 0 0-4-2.5h-2A3.5 3.5 0 0 0 8 8c0 1.6 1.2 2.7 3 3.3"/><path d="M7 17a4 4 0 0 0 4 2.5h2a3.5 3.5 0 0 0 3-3.4"/></>,
}

export function Ico({ n, size = 17, cor = 'currentColor', strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={cor}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...(style || {}) }} aria-hidden="true">
      {P[n] || P.alerta}
    </svg>
  )
}

const TONS = {
  neutro:  { cor: t => t.text,     borda: t => t.border,   fundo: t => t.bgCard },
  suave:   { cor: t => t.textSoft, borda: t => t.border,   fundo: t => 'transparent' },
  perigo:  { cor: () => '#D14343', borda: () => '#f3d3d3', fundo: t => t.bgCard },
  sucesso: { cor: () => '#2E7A3E', borda: () => '#cfe6d2', fundo: t => t.bgCard },
  zap:     { cor: () => '#1a8a4e', borda: () => '#bfe9d1', fundo: t => t.bgCard },
}

/**
 * Botao redondo so com icone. Area de toque de 40px (confortavel no dedo),
 * balao 100% redondo e o texto vira tooltip/leitor de tela.
 */
export function BotaoIco({ n, t, titulo, onClick, tom = 'neutro', size = 40, ativo, style }) {
  const [sobre, setSobre] = useState(false)
  const T = TONS[tom] || TONS.neutro
  return (
    <button type="button" onClick={onClick} title={titulo} aria-label={titulo}
      onMouseEnter={() => setSobre(true)} onMouseLeave={() => setSobre(false)}
      className="sg-btn"
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0, padding: 0, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
        border: '1px solid ' + (ativo ? t.accent : T.borda(t)),
        background: ativo ? t.accentSoft : (sobre ? t.bgHover : T.fundo(t)),
        color: ativo ? t.accentDark : T.cor(t),
        ...(style || {}),
      }}>
      <Ico n={n} size={Math.round(size * 0.45)} />
    </button>
  )
}

/** Igual ao de cima, mas em pilula com rotulo — pra acao principal. */
export function BotaoPill({ n, t, children, onClick, tom = 'neutro', style }) {
  const [sobre, setSobre] = useState(false)
  const T = TONS[tom] || TONS.neutro
  return (
    <button type="button" onClick={onClick} className="sg-btn"
      onMouseEnter={() => setSobre(true)} onMouseLeave={() => setSobre(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px',
        borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
        border: '1px solid ' + T.borda(t), background: sobre ? t.bgHover : T.fundo(t), color: T.cor(t),
        ...(style || {}),
      }}>
      <Ico n={n} size={16} />{children}
    </button>
  )
}
