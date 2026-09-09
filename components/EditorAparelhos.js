import { useState, useRef } from 'react'
import { Ico } from '../lib/icones'
import { MARCADORES, aplicarMarca } from '../lib/texto'
import { SERVICOS_PADRAO, GRUPOS_SERVICO } from '../lib/servicos'
import { APARELHO0, somaAparelhos } from '../lib/aparelhos'

/**
 * Editor de aparelhos da OS.
 *
 * Um bloco por aparelho: nome + servicos daquele aparelho + valor (opcional).
 * Com um aparelho so, parece o formulario de sempre. Clicando em
 * "+ Adicionar aparelho" abre o segundo bloco — e o recibo sai com cada
 * aparelho separado em vez de tudo misturado numa lista so.
 *
 * Os componentes ficam FORA do principal de proposito: se ficarem dentro,
 * o React recria a cada tecla e o campo perde o foco.
 */

// campo de servico de UM aparelho, com os botoes de negrito/italico e as
// sugestoes do que a empresa ja fez antes
function CampoServicoAparelho({ valor, onChange, t, sugestoes }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const v = valor || ''

  function marcar(marca) {
    const el = ref.current
    if (!el) return
    const r = aplicarMarca(v, el.selectionStart, el.selectionEnd, marca)
    onChange(r.valor)
    setTimeout(() => { el.focus(); el.setSelectionRange(r.inicio, r.fim) }, 0)
  }

  const linhas = v.split('\n')
  const atual = (linhas[linhas.length - 1] || '').trim().toLowerCase()
  const todas = [...new Set([...(sugestoes || []), ...SERVICOS_PADRAO])]
  const lista = todas.filter(s => !atual || s.toLowerCase().includes(atual))
                     .filter(s => s.toLowerCase() !== atual).slice(0, 10)
  const mostrarGrupos = !atual && !v.trim()

  function escolher(s) {
    const l = v.split('\n')
    l[l.length - 1] = s
    onChange(l.join('\n') + '\n')
    setAberto(true)
  }

  const st = { width:'100%', padding:'9px 10px', borderRadius:10, border:'1px solid '+t.border, fontSize:14,
               fontFamily:'inherit', background:t.bgInput, color:t.text, minHeight:74, resize:'vertical', lineHeight:1.5 }

  return (
    <div>
      <div style={{display:'flex', gap:5, marginBottom:5, alignItems:'center', flexWrap:'wrap'}}>
        {MARCADORES.map(m => (
          <button key={m.chave} type="button" title={m.chave} aria-label={m.chave} className="sg-btn"
            onMouseDown={e => e.preventDefault()} onClick={() => marcar(m.marca)}
            style={{width:32, height:32, borderRadius:'50%', border:'1px solid '+t.border, background:t.bgCard, color:t.text,
                    cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0}}>
            <Ico n={m.chave} size={14}/>
          </button>
        ))}
        <span style={{fontSize:10.5, color:t.textSoft}}>selecione o texto e clique</span>
      </div>
      <textarea ref={ref} style={st} value={v} placeholder={'Uma linha por serviço. Ex:\nTroca do motor\nCarga de gás'}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setAberto(true)} onBlur={() => setTimeout(() => setAberto(false), 180)}/>

      {aberto && mostrarGrupos && (
        <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:9}}>
          {GRUPOS_SERVICO.map(g => (
            <div key={g.grupo}>
              <div style={{fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.06em',
                           color:t.textSoft, marginBottom:5, display:'flex', alignItems:'center', gap:6}}>
                <span style={{width:8, height:8, borderRadius:99, background:g.cor, display:'inline-block'}}/>{g.grupo}
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                {g.itens.slice(0, 8).map(s => (
                  <button key={s} type="button" onMouseDown={e => e.preventDefault()} onClick={() => escolher(s)}
                    style={{padding:'5px 11px', borderRadius:999, border:'1px solid '+t.border, background:t.bgCard,
                            color:t.text, fontSize:12, cursor:'pointer', fontFamily:'inherit'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {aberto && !mostrarGrupos && lista.length > 0 && (
        <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:6}}>
          {lista.map(s => (
            <button key={s} type="button" onMouseDown={e => e.preventDefault()} onClick={() => escolher(s)}
              style={{padding:'5px 11px', borderRadius:999, border:'1px solid '+t.border, background:t.bgCard,
                      color:t.text, fontSize:12, cursor:'pointer', fontFamily:'inherit'}}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CardAparelho({ ap, i, total, t, sugestoes, comValor, up, remover }) {
  const varios = total > 1
  const lbl = { display:'block', fontSize:11, color:t.textSoft, fontWeight:500, marginBottom:3 }
  const inp = { width:'100%', padding:'9px 10px', borderRadius:10, border:'1px solid '+t.border,
                fontSize:14, fontFamily:'inherit', background:t.bgInput, color:t.text }

  return (
    <div style={varios
      ? {border:'1px solid '+t.border, borderRadius:14, padding:'12px 13px 13px', background:t.bgSidebar}
      : {}}>
      {varios && (
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9}}>
          <span style={{display:'inline-flex', alignItems:'center', gap:7, fontSize:10.5, fontWeight:800,
                        textTransform:'uppercase', letterSpacing:'.07em', color:t.textSoft}}>
            <span style={{width:20, height:20, borderRadius:'50%', background:t.accent, color:'#fff',
                          display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800}}>{i + 1}</span>
            Aparelho {i + 1}
          </span>
          <button type="button" className="sg-btn" title="Remover este aparelho" onClick={() => remover(i)}
            style={{width:30, height:30, borderRadius:'50%', border:'1px solid #f3d3d3', background:t.bgCard,
                    color:'#D14343', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0}}>
            <Ico n="apagar" size={14}/>
          </button>
        </div>
      )}

      <div style={{marginBottom:10}}>
        <label style={lbl}>Aparelho / Equipamento</label>
        <input style={inp} value={ap.nome || ''} placeholder="Ex: Lavadora Brastemp BWK12"
          onChange={e => up(i, 'nome', e.target.value)}/>
      </div>

      <div style={{marginBottom: comValor ? 10 : 0}}>
        <label style={lbl}>Serviço realizado <span style={{color:t.textSoft}}>(uma linha por serviço)</span></label>
        <CampoServicoAparelho valor={ap.servico} onChange={v => up(i, 'servico', v)} t={t} sugestoes={sugestoes}/>
      </div>

      {comValor && (
        <div>
          <label style={lbl}>Valor deste aparelho (R$) <span style={{color:t.textSoft}}>— opcional</span></label>
          <input type="number" style={{...inp, maxWidth:180, fontVariantNumeric:'tabular-nums'}}
            value={ap.valor == null ? '' : ap.valor} placeholder="0,00"
            onChange={e => up(i, 'valor', e.target.value)}/>
        </div>
      )}
    </div>
  )
}

export default function EditorAparelhos({ lista, onChange, t, sugestoes, comValor }) {
  const aps = (lista && lista.length) ? lista : [{ ...APARELHO0 }]
  const soma = somaAparelhos(aps)
  const fmt = n => Number(n || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  function up(i, campo, v) { onChange(aps.map((a, k) => k === i ? { ...a, [campo]: v } : a)) }
  function add() { onChange([...aps, { ...APARELHO0 }]) }
  function remover(i) { const n = aps.filter((_, k) => k !== i); onChange(n.length ? n : [{ ...APARELHO0 }]) }

  return (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {aps.map((ap, i) => (
          <CardAparelho key={i} ap={ap} i={i} total={aps.length} t={t} sugestoes={sugestoes}
            comValor={comValor} up={up} remover={remover}/>
        ))}
      </div>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginTop:10, flexWrap:'wrap'}}>
        <button type="button" className="sg-btn" onClick={add}
          style={{display:'inline-flex', alignItems:'center', gap:7, padding:'9px 15px', borderRadius:999,
                  border:'1px dashed '+t.accent, background:'transparent', color:t.accent,
                  fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>
          <Ico n="mais" size={15}/> Adicionar aparelho
        </button>
        {soma > 0 && (
          <span style={{fontSize:11.5, color:t.textSoft}}>
            Soma dos aparelhos: <strong style={{color:t.text, fontVariantNumeric:'tabular-nums'}}>{fmt(soma)}</strong>
          </span>
        )}
      </div>
    </div>
  )
}
