/**
 * Painel que sobe de baixo (bottom sheet).
 *
 * Renderiza DIRETO no <body> via portal. Isso e importante: se ficasse dentro
 * da arvore normal, qualquer ancestral com transform/filter/backdrop-filter
 * faria o position:fixed se ancorar nele em vez da tela — e o painel sumia.
 * Assim ele funciona em qualquer tela, esteja o card onde estiver.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function Painel({ aberto, onFechar, titulo, subtitulo, children, t, maxWidth = 520 }) {
  const [montado, setMontado] = useState(false)
  useEffect(() => { setMontado(true) }, [])

  // trava o scroll do fundo e fecha no ESC
  useEffect(() => {
    if (!aberto) return
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = e => { if (e.key === 'Escape') onFechar && onFechar() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = antes; window.removeEventListener('keydown', esc) }
  }, [aberto, onFechar])

  if (!montado || !aberto) return null

  return createPortal(
    <div onClick={onFechar}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.55)',
               backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
               display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="sg-sheet"
        style={{ background: t.bgCard, borderRadius: '22px 22px 0 0', width: '100%', maxWidth,
                 maxHeight: '90vh', overflow: 'auto', border: '1px solid ' + t.border,
                 borderBottom: 'none', boxShadow: '0 -18px 45px -18px rgba(0,0,0,.45)',
                 padding: '10px 20px calc(20px + env(safe-area-inset-bottom))' }}>
        {/* alcinha */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 12px' }}>
          <div style={{ width: 42, height: 4, borderRadius: 99, background: t.border }} />
        </div>
        {(titulo || subtitulo) && (
          <div style={{ marginBottom: 16 }}>
            {titulo && <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{titulo}</div>}
            {subtitulo && <div style={{ fontSize: 13, color: t.textSoft, marginTop: 3 }}>{subtitulo}</div>}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
