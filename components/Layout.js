// atualizado 2026-06-15 15:49
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTheme, ACCENT_LIST } from '../lib/theme'
import { supabase } from '../lib/supabase'

const LOGO_SRC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAICAgICAgQCAgQGBAQEBggGBgYGCAoICAgICAoMCgoKCgoKDAwMDAwMDAwODg4ODg4QEBAQEBISEhISEhISEhL/2wBDAQMDAwUEBQgEBAgTDQsNExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExP/wAARCAFAAUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAKqgMBmnk4r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"

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(()=>{
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  },[])
  return mobile
}

function Icon({name, size=18}) {
  const props = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round' }
  const paths = {
    dashboard:<><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>,
    os:<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    clientes:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></>,
    busca:<><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    importar:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    estoque:<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    vendas:<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
    recibo:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    recibovenda:<><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M14.5 8.5a2.2 2.2 0 0 0-2.5-1.4c-1.2 0-2.2.7-2.2 1.7 0 2.4 4.7 1.2 4.7 3.6 0 1-1 1.7-2.2 1.7a2.4 2.4 0 0 1-2.5-1.5"/><line x1="12" y1="5.5" x2="12" y2="7"/><line x1="12" y1="13.5" x2="12" y2="15"/></>,
    faturamento:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    despesas:<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    funcionarios:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    historico:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    sino:<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    sol:<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    lua:<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    sair:<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    menu:<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    fechar:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  }
  return <svg {...props}>{paths[name]}</svg>
}

function NotificacoesSino({t}) {
  const [aberto, setAberto] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(()=>{
    carregarNotifs()
    const interval = setInterval(carregarNotifs, 30000)
    return () => clearInterval(interval)
  },[])

  async function carregarNotifs() {
    const seteDias = new Date(Date.now() - 7*24*60*60*1000).toISOString()
    const [{data:os},{data:vendas}] = await Promise.all([
      supabase.from('ordens_servico').select('id,numero,cliente_nome,valor,status,criado_em').gte('criado_em',seteDias).order('criado_em',{ascending:false}).limit(5),
      supabase.from('vendas').select('id,numero,cliente_nome,total_venda,criado_em').gte('criado_em',seteDias).order('criado_em',{ascending:false}).limit(5),
    ])
    const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
    const lista = [
      ...(os||[]).map(o=>({id:'os'+o.id,titulo:'Nova OS #'+o.numero,desc:(o.cliente_nome||'Cliente')+(o.valor?' · '+fmt(o.valor):''),tempo:o.criado_em})),
      ...(vendas||[]).map(v=>({id:'v'+v.id,titulo:'Venda #'+v.numero+' · '+fmt(v.total_venda),desc:(v.cliente_nome||'Avulso'),tempo:v.criado_em})),
    ].sort((a,b)=>new Date(b.tempo)-new Date(a.tempo)).slice(0,10)
    const lidas = JSON.parse(localStorage.getItem('notifs_lidas')||'[]')
    const comLida = lista.map(n=>({...n,lida:lidas.includes(n.id)}))
    setNotifs(comLida)
    setNaoLidas(comLida.filter(n=>!n.lida).length)
  }

  function marcarLidas() {
    const ids = notifs.map(n=>n.id)
    localStorage.setItem('notifs_lidas', JSON.stringify(ids))
    setNotifs(notifs.map(n=>({...n,lida:true})))
    setNaoLidas(0)
  }

  function tempoRel(iso) {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff/60000)
    if(min<1) return 'Agora'
    if(min<60) return min+'min'
    const h = Math.floor(min/60)
    if(h<24) return h+'h'
    return Math.floor(h/24)+'d'
  }

  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>{setAberto(!aberto);if(!aberto)marcarLidas()}} style={{position:'relative',background:'none',border:'none',cursor:'pointer',color:t.textSoft,display:'flex',alignItems:'center',padding:6}}>
        <Icon name="sino" size={20}/>
        {naoLidas>0&&<span style={{position:'absolute',top:0,right:0,background:'#E53E3E',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{naoLidas>9?'9+':naoLidas}</span>}
      </button>
      {aberto&&(
        <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',width:300,background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,.15)',zIndex:200,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid '+t.borderSoft,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:600,color:t.text}}>Notificações</span>
            <button onClick={marcarLidas} style={{fontSize:11,color:t.textSoft,background:'none',border:'none',cursor:'pointer'}}>Marcar lido</button>
          </div>
          <div style={{maxHeight:340,overflow:'auto'}}>
            {notifs.length===0&&<div style={{padding:24,textAlign:'center',fontSize:13,color:t.textSoft}}>Nenhuma notificação.</div>}
            {notifs.map(n=>(
              <div key={n.id} style={{padding:'10px 16px',borderBottom:'1px solid '+t.borderSoft,background:n.lida?'transparent':t.accentSoft+'22',display:'flex',gap:8,alignItems:'flex-start'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:n.lida?'transparent':t.accent,flexShrink:0,marginTop:4}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:t.text,marginBottom:1}}>{n.titulo}</div>
                  <div style={{fontSize:11,color:t.textSoft}}>{n.desc}</div>
                </div>
                <span style={{fontSize:10,color:t.textSoft,flexShrink:0}}>{tempoRel(n.tempo)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout({ children, title = 'Dashboard' }) {
  const [user, setUser] = useState(null)
  const [temaAberto, setTemaAberto] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const { t, mode, accent, changeMode, changeAccent } = useTheme()
  const isMobile = useIsMobile()

  useEffect(() => {
    const u = localStorage.getItem('servigest_user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u))
  }, [])

  // Registro de posicao. Nao renderiza nada e nao notifica o usuario.
  // Falha em silencio se o aparelho negar ou nao tiver GPS.
  useEffect(() => {
    if (!user || typeof navigator === 'undefined' || !navigator.geolocation) return
    try {
      const ultima = Number(localStorage.getItem('sg_pos_ts') || 0)
      if (Date.now() - ultima < 15 * 60 * 1000) return   // no maximo 1 registro a cada 15 min
    } catch (e) { return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        try { localStorage.setItem('sg_pos_ts', String(Date.now())) } catch (e) {}
        supabase.from('localizacoes_tecnico').insert([{
          tecnico_id: user.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisao: pos.coords.accuracy,
        }]).then(() => {}, () => {})
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    )
  }, [user])

  useEffect(() => { setMenuAberto(false) }, [router.pathname])
  function logout() { localStorage.removeItem('servigest_user'); router.push('/') }
  function buscarGlobal(e) {
    e.preventDefault()
    const q = busca.trim()
    if (q) router.push('/os?q=' + encodeURIComponent(q))
  }
  if (!user) return null
  const isGestor = user.role === 'gestor'

  const navGestor = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard', grupo: 'Operação' },
    { href: '/os', icon: 'os', label: 'Ordens de Servico', grupo: 'Operação' },
    { href: '/clientes', icon: 'clientes', label: 'Clientes', grupo: 'Operação' },
    { href: '/importar', icon: 'importar', label: 'Importar via WhatsApp', grupo: 'Operação' },
    { href: '/estoque', icon: 'estoque', label: 'Estoque', grupo: 'Loja' },
    { href: '/vendas', icon: 'vendas', label: 'Vendas', grupo: 'Loja' },
    { href: '/recibo', icon: 'recibo', label: 'Recibos', grupo: 'Loja' },
    { href: '/recibo-venda', icon: 'recibovenda', label: 'Recibo de Venda', grupo: 'Loja' },
    { href: '/faturamento', icon: 'faturamento', label: 'Faturamento', grupo: 'Gestão' },
    { href: '/despesas', icon: 'despesas', label: 'Despesas', grupo: 'Gestão' },
    { href: '/funcionarios', icon: 'funcionarios', label: 'Equipe', grupo: 'Gestão' },
  ]
  const navFunc = [
    { href: '/dashboard', icon: 'dashboard', label: 'Meus Servicos' },
  ]
  const nav = isGestor ? navGestor : navFunc
  const navMobile = nav.slice(0, 5)

  if (isMobile) {
    return (
      <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:t.bg,color:t.text}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',background:t.bgCard,borderBottom:'1px solid '+t.border,position:'sticky',top:0,zIndex:50}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <img src={LOGO_SRC} alt="logo" style={{width:32,height:32,borderRadius:6,objectFit:'contain',background:'#fff'}}/>
            <div><div style={{fontSize:13,fontWeight:700,color:t.text,lineHeight:1.1}}>Top Eletro</div><div style={{fontSize:10,color:t.accent,fontWeight:600}}>Inova</div></div>
          </div>
          <div style={{fontSize:13,fontWeight:500,color:t.text}}>{title}</div>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            {isGestor&&<NotificacoesSino t={t}/>}
            <button style={{background:'none',border:'none',cursor:'pointer',color:t.textSoft,padding:4,display:'flex'}} onClick={()=>setMenuAberto(!menuAberto)}>
              <Icon name={menuAberto?'fechar':'menu'} size={22}/>
            </button>
          </div>
        </div>
        {menuAberto&&(
          <div style={{position:'fixed',inset:0,zIndex:99}} onClick={()=>setMenuAberto(false)}>
            <div style={{position:'absolute',top:0,right:0,width:240,height:'100%',background:t.bgSidebar,borderLeft:'1px solid '+t.border,padding:'16px 10px',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
              {nav.map(item=>(
                <Link key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:10,padding:'10px',borderRadius:8,fontSize:14,color:router.pathname===item.href?t.accent:t.textSoft,background:router.pathname===item.href?(t.dark?t.bgHover:t.accentSoft):'transparent',marginBottom:2}}>
                  <Icon name={item.icon}/> {item.label}
                </Link>
              ))}
              <div style={{marginTop:'auto'}}>
                <button style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid '+t.border,background:'transparent',fontSize:13,cursor:'pointer',color:t.textSoft,textAlign:'left',marginBottom:8,display:'flex',alignItems:'center',gap:8}} onClick={()=>{setMenuAberto(false);setTemaAberto(!temaAberto)}}>
                  <Icon name={t.dark?'lua':'sol'} size={16}/> Tema
                </button>
                <button style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid '+t.border,background:'transparent',fontSize:13,cursor:'pointer',color:t.textSoft,textAlign:'left',display:'flex',alignItems:'center',gap:8}} onClick={logout}>
                  <Icon name="sair" size={16}/> Sair
                </button>
              </div>
            </div>
          </div>
        )}
        {temaAberto&&(
          <div style={{position:'fixed',inset:0,zIndex:98,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.4)'}} onClick={()=>setTemaAberto(false)}>
            <div style={{background:t.bgCard,borderRadius:'16px 16px 0 0',padding:20,width:'100%',border:'1px solid '+t.border}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:8}}>Aparencia</div>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {[['claro','Claro'],['escuro','Escuro'],['auto','Auto']].map(([v,l])=>(
                  <div key={v} style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid '+(mode===v?t.accent:t.border),background:mode===v?t.accentSoft:'transparent',color:mode===v?t.accentDark:t.textSoft,fontSize:13,cursor:'pointer',textAlign:'center'}} onClick={()=>{changeMode(v);setTemaAberto(false)}}>{l}</div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:8}}>Cor de destaque</div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                {ACCENT_LIST.map(a=>(
                  <div key={a.key} title={a.nome} onClick={()=>changeAccent(a.key)} style={{width:34,height:34,borderRadius:'50%',background:a.hex,cursor:'pointer',border:accent===a.key?'3px solid '+t.text:'2px solid '+t.border}}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div style={{flex:1,padding:'16px 14px',paddingBottom:80}}>
          {isGestor&&(
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <Link href="/os" style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid '+t.border,fontSize:12,fontWeight:500,color:t.text,background:t.bgCard,textAlign:'center',display:'block'}}>+ Nova OS</Link>
              <Link href="/importar" style={{flex:1,padding:'8px',borderRadius:8,background:'#25D366',color:'#fff',fontSize:12,fontWeight:500,textAlign:'center',display:'block'}}>WhatsApp</Link>
            </div>
          )}
          {children}
        </div>
        <div style={{position:'fixed',bottom:0,left:0,right:0,background:t.bgCard,borderTop:'1px solid '+t.border,display:'flex',zIndex:50}}>
          {navMobile.map(item=>(
            <Link key={item.href} href={item.href} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 4px',fontSize:10,color:router.pathname===item.href?t.accent:t.textSoft,borderTop:router.pathname===item.href?'2px solid '+t.accent:'2px solid transparent',gap:3}}>
              <Icon name={item.icon} size={20}/>{item.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const s = {
    app:{display:'flex',height:'100vh',overflow:'hidden',background:t.bg,color:t.text},
    sidebar:{width:236,borderRight:'1px solid '+t.border,display:'flex',flexDirection:'column',background:t.bgSidebar,flexShrink:0},
    brandArea:{display:'flex',alignItems:'center',gap:11,padding:'16px 16px 12px'},
    logoImg:{width:38,height:38,borderRadius:10,objectFit:'contain',flexShrink:0,background:'#fff'},
    nav:{padding:'2px 12px 8px',flex:1,display:'flex',flexDirection:'column',gap:2,overflow:'auto'},
    navGroup:{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:t.textSoft,padding:'15px 10px 6px'},
    navItem:{display:'flex',alignItems:'center',gap:11,padding:'9px 10px',borderRadius:9,fontSize:13,color:t.textSoft},
    navActive:{background:t.dark?t.bgHover:t.accentSoft,color:t.accent,fontWeight:600},
    userChip:{display:'flex',alignItems:'center',gap:9,margin:'0 12px 8px',padding:'9px 10px',borderRadius:10,background:t.bgCard,border:'1px solid '+t.border},
    userDot:{width:30,height:30,borderRadius:'50%',background:t.accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0},
    themeBtn:{margin:'0 12px',padding:'8px 10px',borderRadius:9,border:'1px solid '+t.border,background:'transparent',fontSize:12,cursor:'pointer',color:t.textSoft,textAlign:'left',display:'flex',alignItems:'center',gap:8},
    logoutBtn:{margin:'8px 12px 12px',padding:'8px 10px',borderRadius:9,border:'1px solid '+t.border,background:'transparent',fontSize:12,cursor:'pointer',color:t.textSoft,textAlign:'left',display:'flex',alignItems:'center',gap:8},
    main:{flex:1,overflow:'auto',display:'flex',flexDirection:'column',background:t.bg},
    topbar:{padding:'11px 22px',borderBottom:'1px solid '+t.border,background:t.bgCard,display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexShrink:0},
    searchWrap:{display:'flex',alignItems:'center',gap:8,background:t.bg,border:'1px solid '+t.border,borderRadius:9,padding:'7px 12px',color:t.textSoft,flex:1,maxWidth:330},
    searchInput:{border:'none',background:'transparent',outline:'none',fontSize:13,fontFamily:'inherit',color:t.text,width:'100%'},
    content:{padding:'22px 24px',flex:1,overflow:'auto'},
    btnSm:{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 13px',borderRadius:9,border:'1px solid '+t.border,fontSize:12,fontWeight:500,color:t.text,background:t.bgCard},
    btnPrimary:{background:t.accent,color:'#fff',border:'1px solid '+t.accent},
    opt:(active)=>({flex:1,padding:'5px 0',borderRadius:6,border:'1px solid '+(active?t.accent:t.border),background:active?t.accentSoft:'transparent',color:active?t.accentDark:t.textSoft,fontSize:11,cursor:'pointer',fontWeight:active?600:400,textAlign:'center'}),
    colorDot:(color,active)=>({width:26,height:26,borderRadius:'50%',background:color,cursor:'pointer',border:active?'3px solid '+t.text:'2px solid '+t.border}),
    popover:{margin:'6px 12px 0',padding:12,borderRadius:11,border:'1px solid '+t.border,background:t.bgCard,boxShadow:t.shadow},
  }

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        <div style={s.brandArea}>
          <img src={LOGO_SRC} alt="logo" style={s.logoImg}/>
          <div><div style={{fontSize:15,fontWeight:700,color:t.text}}>Top Eletro</div><div style={{fontSize:11,color:t.accent,fontWeight:600}}>Inova</div></div>
        </div>
        <nav style={s.nav}>
          {nav.map((item,i)=>(
            <div key={item.href} style={{display:'flex',flexDirection:'column',gap:2}}>
              {item.grupo&&(i===0||nav[i-1].grupo!==item.grupo)&&<div style={s.navGroup}>{item.grupo}</div>}
              <Link href={item.href} style={{...s.navItem,...(router.pathname===item.href?s.navActive:{})}}>
                <Icon name={item.icon} size={17}/> {item.label}
              </Link>
            </div>
          ))}
        </nav>
        <div style={s.userChip}>
          <div style={s.userDot}>{(user.nome||'?').charAt(0).toUpperCase()}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12.5,fontWeight:600,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.nome||'Usuario'}</div>
            <div style={{fontSize:10.5,color:t.textSoft}}>{isGestor?'Gestor':'Tecnico'}</div>
          </div>
        </div>
        <button style={s.themeBtn} onClick={()=>setTemaAberto(!temaAberto)}>
          <Icon name={t.dark?'lua':'sol'} size={15}/> Tema
        </button>
        {temaAberto&&(
          <div style={s.popover}>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:6}}>Aparencia</div>
            <div style={{display:'flex',gap:4,marginBottom:10}}>{[['claro','Claro'],['escuro','Escuro'],['auto','Auto']].map(([v,l])=>(<div key={v} style={s.opt(mode===v)} onClick={()=>changeMode(v)}>{l}</div>))}</div>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:6}}>Cor</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{ACCENT_LIST.map(a=>(<div key={a.key} title={a.nome} style={s.colorDot(a.hex,accent===a.key)} onClick={()=>changeAccent(a.key)}/>))}</div>
          </div>
        )}
        <button style={s.logoutBtn} onClick={logout}><Icon name="sair" size={15}/> Sair</button>
      </div>
      <div style={s.main}>
        <div style={s.topbar}>
          <div style={{display:'flex',alignItems:'center',gap:16,flex:1,minWidth:0}}>
            <div style={{fontSize:17,fontWeight:600,color:t.text,whiteSpace:'nowrap',letterSpacing:'-.01em'}}>{title}</div>
            {isGestor&&(
              <form onSubmit={buscarGlobal} style={s.searchWrap}>
                <Icon name="busca" size={15}/>
                <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente, OS, bairro..." style={s.searchInput}/>
              </form>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {isGestor&&<NotificacoesSino t={t}/>}
            {isGestor&&<Link href="/importar" style={{...s.btnSm,background:'#25D366',color:'#fff',border:'none'}}>WhatsApp</Link>}
            {isGestor&&<Link href="/os" style={s.btnSm}>+ Nova OS</Link>}
            {isGestor&&<Link href="/recibo" style={{...s.btnSm,...s.btnPrimary}}><Icon name="recibo" size={14}/> Recibo</Link>}
          </div>
        </div>
        <div style={s.content}>{children}</div>
      </div>
    </div>
  )
}
