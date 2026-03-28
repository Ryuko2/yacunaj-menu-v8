import { useState, useCallback } from 'react'

const STAFF_PIN = '1234'

const MENU = [
  { id:'cap',  name:'Cappuccino',             cat:'Cafés',     price:65, opts:[
    { label:'Tamaño',      key:'size',   req:true,  multi:false, choices:['Chico 8oz','Mediano 12oz','Grande 16oz'] },
    { label:'Leche',       key:'milk',   req:true,  multi:false, choices:['Entera','Deslactosada','Vegetal'] },
    { label:'Extras',      key:'extra',  req:false, multi:true,  choices:['Sin azúcar','Extra shot','Vainilla','Caramelo'] },
  ]},
  { id:'lat',  name:'Latte',                  cat:'Cafés',     price:70, opts:[
    { label:'Tamaño',      key:'size',   req:true,  multi:false, choices:['Chico 8oz','Mediano 12oz','Grande 16oz'] },
    { label:'Leche',       key:'milk',   req:true,  multi:false, choices:['Entera','Deslactosada','Vegetal'] },
    { label:'Sabor',       key:'flavor', req:false, multi:false, choices:['Natural','Vainilla','Caramelo','Avellana'] },
  ]},
  { id:'esp',  name:'Espresso',               cat:'Cafés',     price:50, opts:[
    { label:'Shots',       key:'shots',  req:true,  multi:false, choices:['Simple','Doble','Triple'] },
  ]},
  { id:'ame',  name:'Americano',              cat:'Cafés',     price:55, opts:[
    { label:'Tamaño',      key:'size',   req:true,  multi:false, choices:['Chico','Mediano','Grande'] },
  ]},
  { id:'mat',  name:'Matcha Latte',           cat:'Cafés',     price:75, opts:[
    { label:'Leche',       key:'milk',   req:true,  multi:false, choices:['Entera','Deslactosada','Vegetal'] },
    { label:'Dulzura',     key:'sweet',  req:true,  multi:false, choices:['Sin azúcar','Poco dulce','Normal','Dulce'] },
  ]},
  { id:'frap', name:'Frappé',                 cat:'Cafés',     price:80, opts:[
    { label:'Sabor',       key:'flavor', req:true,  multi:false, choices:['Café','Caramelo','Vainilla','Chocolate','Matcha'] },
    { label:'Extras',      key:'extra',  req:false, multi:true,  choices:['Crema chantilly','Extra shot','Sin azúcar'] },
  ]},
  { id:'sd_fr', name:'Soda Frambuesa',        cat:'Sodas',     price:60, opts:[] },
  { id:'sd_fs', name:'Soda Fresa',            cat:'Sodas',     price:60, opts:[] },
  { id:'sd_mn', name:'Soda Menta',            cat:'Sodas',     price:60, opts:[] },
  { id:'sd_mb', name:'Soda Mora Azul',        cat:'Sodas',     price:60, opts:[] },
  { id:'sd_mc', name:'Soda Maracuyá',         cat:'Sodas',     price:60, opts:[] },
  { id:'sd_zz', name:'Soda Zarzamora',        cat:'Sodas',     price:60, opts:[] },
  { id:'sm_sw', name:'Smoothie Sandía',       cat:'Smoothies', price:60, opts:[
    { label:'Extras', key:'extra', req:false, multi:true, choices:['Sin azúcar','Con chía','Extra hielo'] },
  ]},
  { id:'sm_fr', name:'Smoothie Frutos Rojos', cat:'Smoothies', price:60, opts:[
    { label:'Extras', key:'extra', req:false, multi:true, choices:['Sin azúcar','Con chía','Extra hielo'] },
  ]},
  { id:'sm_mg', name:'Smoothie Mango',        cat:'Smoothies', price:60, opts:[
    { label:'Extras', key:'extra', req:false, multi:true, choices:['Sin azúcar','Con chía','Extra hielo'] },
  ]},
  { id:'ts_fk', name:'Tisana Fresa Kiwi',     cat:'Tisanas',   price:65, opts:[
    { label:'Temperatura', key:'temp', req:true, multi:false, choices:['Caliente','Frío con hielo'] },
  ]},
  { id:'ts_jl', name:'Tisana Jengibre Limón', cat:'Tisanas',   price:65, opts:[
    { label:'Temperatura', key:'temp', req:true, multi:false, choices:['Caliente','Frío con hielo'] },
  ]},
  { id:'cz_zz', name:'Cheesecake Zarzamora',  cat:'Postres',   price:65, opts:[
    { label:'Porción', key:'size', req:true, multi:false, choices:['Rebanada','Medio pastel','Entero'] },
  ]},
  { id:'cz_tr', name:'Cheesecake Tortuga',    cat:'Postres',   price:65, opts:[
    { label:'Porción', key:'size', req:true, multi:false, choices:['Rebanada','Medio pastel','Entero'] },
  ]},
  { id:'ps_ch', name:'Pastel Chocolate',      cat:'Postres',   price:65, opts:[
    { label:'Porción', key:'size', req:true, multi:false, choices:['Rebanada','Medio pastel','Entero'] },
  ]},
  { id:'py_nu', name:'Pay de Nuez',           cat:'Postres',   price:65, opts:[] },
  { id:'py_lm', name:'Pay de Limón',          cat:'Postres',   price:65, opts:[] },
  { id:'mf',    name:'Muffin',                cat:'Postres',   price:45, opts:[
    { label:'Sabor', key:'flavor', req:true, multi:false, choices:['Chispas chocolate','Arándano','Limón'] },
  ]},
  { id:'bsq',   name:'Bisquet',               cat:'Postres',   price:50, opts:[
    { label:'Acompañamiento', key:'side', req:false, multi:true, choices:['Mermelada fresa','Mermelada mora','Mantequilla','Miel'] },
  ]},
  { id:'sw_m',  name:'Sandwich Momia',        cat:'Comida',    price:85, opts:[
    { label:'Pan',    key:'bread', req:true,  multi:false, choices:['Blanco','Integral','Centeno'] },
    { label:'Extras', key:'extra', req:false, multi:true,  choices:['Sin cebolla','Sin jitomate','Extra queso','Picante'] },
  ]},
  { id:'bag',   name:'Baguette',              cat:'Comida',    price:95, opts:[
    { label:'Relleno', key:'fill',  req:true,  multi:false, choices:['Jamón y queso','Pollo y pesto','Vegetariano'] },
    { label:'Extras',  key:'extra', req:false, multi:true,  choices:['Sin cebolla','Extra queso','Picante'] },
  ]},
  { id:'piz',   name:'Pizza',                 cat:'Comida',    price:95, opts:[
    { label:'Sabor',  key:'flavor', req:true,  multi:false, choices:['Margherita','Pepperoni','Hawaiana','Vegetariana'] },
    { label:'Extras', key:'extra', req:false, multi:true,  choices:['Extra queso','Sin cebolla'] },
  ]},
  { id:'dq',    name:'Dedos de Queso',        cat:'Snacks',    price:110, opts:[
    { label:'Salsa', key:'sauce', req:false, multi:true, choices:['BBQ','Ranch','Valentina','Sin salsa'] },
  ]},
  { id:'pp',    name:'Papas Fritas',          cat:'Snacks',    price:55, opts:[
    { label:'Sazón', key:'season', req:true,  multi:false, choices:['Natural','Sal y pimienta','Limón y chile'] },
    { label:'Salsa', key:'sauce',  req:false, multi:true, choices:['Cátsup','Ranch','BBQ'] },
  ]},
  { id:'nch',   name:'Nachos',                cat:'Snacks',    price:55, opts:[
    { label:'Extras', key:'extra', req:false, multi:true, choices:['Extra queso','Jalapeños','Guacamole','Crema'] },
  ]},
  { id:'slch',  name:'Salchipulpos',          cat:'Snacks',    price:55, opts:[] },
]

const CATEGORIES = [...new Set(MENU.map(i => i.cat))]
const TOKENS = {
  1:'tok_t1_abc123',  2:'tok_t2_bcd234',  3:'tok_t3_cde345',
  4:'tok_t4_def456',  5:'tok_t5_efg567',  6:'tok_t6_fgh678',
  7:'tok_t7_ghi789',  8:'tok_t8_hij890',  9:'tok_t9_ijk901',
  10:'tok_t10_bcd890',
}

const C = {
  bg:'#0A1A0F', card:'#152B1A', light:'#1C3822',
  gold:'#C9A227', ivory:'#F5F0E8', muted:'rgba(245,240,232,0.5)',
  border:'rgba(201,162,39,0.2)', red:'#E53E3E',
}

const TAP = { touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }

function okey(itemId, sel) {
  return itemId + '__' + Object.entries(sel || {})
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}:${Array.isArray(v) ? [...v].sort().join(',') : v}`)
    .join('|')
}

function PinScreen({ onAuth }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)

  const press = (k) => {
    if (k === 'DEL') { setPin(p => p.slice(0,-1)); setErr(false); return }
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) {
      if (next === STAFF_PIN) { onAuth() }
      else { setErr(true); setTimeout(() => { setPin(''); setErr(false) }, 600) }
    }
  }

  return (
    <div style={{ minHeight:'100dvh', background:C.bg, display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:20, padding:24, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ color:C.gold, fontSize:26, fontWeight:700 }}>Yacunaj Staff</div>
      <div style={{ color:C.muted, fontSize:15 }}>Ingresa tu PIN</div>
      <div style={{ display:'flex', gap:16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:18, height:18, borderRadius:'50%',
            background: i < pin.length ? C.gold : 'rgba(201,162,39,0.15)',
            border:`1px solid ${i < pin.length ? C.gold : 'rgba(201,162,39,0.35)'}`,
            transition:'all 0.1s' }} />
        ))}
      </div>
      <div style={{ height:20, color:C.red, fontSize:13 }}>{err ? 'PIN incorrecto' : ''}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, width:'100%', maxWidth:280 }}>
        {[1,2,3,4,5,6,7,8,9,null,'0','DEL'].map((k, i) => (
          k === null
            ? <div key={i} />
            : <button key={i} onClick={() => press(String(k))} style={{
                height:70, background:C.card, border:`1px solid ${C.border}`,
                borderRadius:14, color: k==='DEL' ? C.muted : C.ivory,
                fontSize: k==='DEL' ? 18 : 26, fontWeight:600,
                fontFamily:'system-ui,sans-serif', ...TAP }}>
              {k === 'DEL' ? '⌫' : k}
            </button>
        ))}
      </div>
    </div>
  )
}

function OptionsSheet({ item, onAdd, onClose }) {
  const [sel, setSel] = useState({})

  const toggle = (key, multi, val) => {
    setSel(prev => {
      if (multi) {
        const cur = prev[key] || []
        return { ...prev, [key]: cur.includes(val) ? cur.filter(v=>v!==val) : [...cur, val] }
      }
      return { ...prev, [key]: val }
    })
  }

  const allReq = item.opts.filter(o => o.req && !o.multi).every(o => sel[o.key])

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
      display:'flex', alignItems:'flex-end', zIndex:200, ...TAP }}>
      <div style={{ width:'100%', background:C.card, borderRadius:'20px 20px 0 0',
        padding:'20px 18px 48px', borderTop:`2px solid ${C.border}`,
        maxHeight:'88dvh', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
        <div style={{ width:44, height:5, background:'rgba(245,240,232,0.2)',
          borderRadius:3, margin:'0 auto 20px' }} />
        <div style={{ color:C.gold, fontSize:22, fontWeight:700, marginBottom:3 }}>{item.name}</div>
        <div style={{ color:C.muted, fontSize:14, marginBottom:22 }}>${item.price}</div>
        {item.opts.map(opt => (
          <div key={opt.key} style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:C.muted, textTransform:'uppercase',
              letterSpacing:'0.08em', marginBottom:10 }}>
              {opt.label}{opt.req && <span style={{color:C.red,marginLeft:4}}>*</span>}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {opt.choices.map(ch => {
                const on = opt.multi ? (sel[opt.key]||[]).includes(ch) : sel[opt.key]===ch
                return (
                  <button key={ch} onClick={() => toggle(opt.key, opt.multi, ch)} style={{
                    background: on ? C.gold : 'rgba(255,255,255,0.07)',
                    border:`1px solid ${on ? C.gold : C.border}`,
                    color: on ? C.bg : C.ivory, borderRadius:22,
                    padding:'10px 16px', fontSize:15, fontWeight: on?700:400,
                    minHeight:48, fontFamily:'system-ui,sans-serif',
                    transition:'all 0.12s', ...TAP }}>
                    {ch}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <button onClick={() => allReq && onAdd(sel)} disabled={!allReq} style={{
          width:'100%', background: allReq ? C.gold : 'rgba(201,162,39,0.3)',
          border:'none', borderRadius:14, padding:'16px 0', marginTop:10,
          color:C.bg, fontWeight:700, fontSize:17, minHeight:56,
          fontFamily:'system-ui,sans-serif', ...TAP }}>
          Agregar a la orden
        </button>
        <button onClick={onClose} style={{ width:'100%', background:'none', border:'none',
          color:C.muted, fontSize:15, padding:'14px 0', minHeight:48,
          fontFamily:'system-ui,sans-serif', ...TAP }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const [authed, setAuthed]       = useState(false)
  const [mesa, setMesa]           = useState(null)
  const [mesaOpen, setMesaOpen]   = useState(false)
  const [cat, setCat]             = useState(CATEGORIES[0])
  const [order, setOrder]         = useState([])
  const [sheetItem, setSheetItem] = useState(null)
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [sendErr, setSendErr]     = useState('')

  const total    = order.reduce((s,r) => s + r.price * r.qty, 0)
  const totalQty = order.reduce((s,r) => s + r.qty, 0)

  const addItem = useCallback((item, opts) => {
    const k = okey(item.id, opts)
    setOrder(prev => {
      const i = prev.findIndex(r => r.key === k)
      if (i >= 0) { const n=[...prev]; n[i]={...n[i],qty:n[i].qty+1}; return n }
      return [...prev, { key:k, itemId:item.id, name:item.name, price:item.price, qty:1, opts }]
    })
  }, [])

  const changeQty = (key, delta) => {
    setOrder(prev => prev.map(r => r.key===key ? {...r,qty:r.qty+delta} : r).filter(r=>r.qty>0))
  }

  const tapItem = (item) => {
    if (item.opts.length === 0) { addItem(item, {}); return }
    setSheetItem(item)
  }

  const sendOrder = async () => {
    if (!mesa || order.length === 0) return
    setSending(true); setSendErr('')
    try {
      const res = await fetch('/api/create-order', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          table_number: mesa,
          qr_token: TOKENS[mesa],
          items: order.map(r => ({
            id:r.itemId, name:r.name, quantity:r.qty,
            finalPrice:r.price, options:r.opts
          })),
          source: 'staff',
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || d.detail || 'Error al enviar')
      setSent(true)
      setTimeout(() => { setOrder([]); setMesa(null); setSent(false) }, 2800)
    } catch(e) {
      setSendErr(e.message)
    } finally {
      setSending(false)
    }
  }

  if (!authed) return <PinScreen onAuth={() => setAuthed(true)} />

  if (sent) return (
    <div style={{ minHeight:'100dvh', background:C.bg, display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:14, fontFamily:'system-ui,sans-serif' }}>
      <div style={{fontSize:72}}>✅</div>
      <div style={{color:C.gold,fontSize:24,fontWeight:700}}>¡Orden enviada!</div>
      <div style={{color:C.muted,fontSize:16}}>Mesa {mesa} · ${total} MXN</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh',
      background:C.bg, color:C.ivory, fontFamily:'system-ui,sans-serif',
      WebkitUserSelect:'none', userSelect:'none' }}>

      {/* HEADER */}
      <div style={{ background:C.card, padding:'12px 16px', display:'flex',
        alignItems:'center', justifyContent:'space-between',
        borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <span style={{color:C.gold,fontSize:18,fontWeight:700}}>Tomar Orden</span>
        <button onClick={() => setMesaOpen(o=>!o)} style={{
          background:'rgba(201,162,39,0.14)', border:`1px solid ${C.border}`,
          color:C.gold, fontSize:15, padding:'10px 16px', borderRadius:10,
          fontFamily:'inherit', minHeight:46, display:'flex', alignItems:'center', gap:6, ...TAP }}>
          Mesa {mesa || '—'} {mesaOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* MESA PICKER */}
      {mesaOpen && (
        <div style={{ background:'#1A3020', padding:'14px 16px',
          borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{color:C.muted,fontSize:12,marginBottom:10}}>Selecciona mesa</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => { setMesa(n); setMesaOpen(false) }} style={{
                height:56, borderRadius:12,
                border:`1px solid ${mesa===n?C.gold:'rgba(201,162,39,0.3)'}`,
                background: mesa===n ? C.gold : 'rgba(201,162,39,0.1)',
                color: mesa===n ? C.bg : C.gold,
                fontSize:22, fontWeight:700, fontFamily:'inherit', ...TAP }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY TABS */}
      <div style={{ display:'flex', overflowX:'auto', background:C.card,
        borderBottom:`1px solid ${C.border}`, flexShrink:0,
        scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            background:'none', border:'none',
            borderBottom:`3px solid ${c===cat?C.gold:'transparent'}`,
            color: c===cat ? C.gold : C.muted,
            padding:'13px 18px', fontSize:15, fontWeight: c===cat?700:400,
            whiteSpace:'nowrap', fontFamily:'inherit', flexShrink:0, minHeight:50,
            transition:'all 0.12s', ...TAP }}>
            {c}
          </button>
        ))}
      </div>

      {/* ITEMS GRID */}
      <div style={{ flex:1, overflowY:'auto', padding:12, WebkitOverflowScrolling:'touch' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {MENU.filter(i=>i.cat===cat).map(item => {
            const qty = order.filter(r=>r.itemId===item.id).reduce((s,r)=>s+r.qty,0)
            return (
              <button key={item.id} onClick={() => tapItem(item)} style={{
                background: qty>0 ? C.light : C.card,
                border:`1px solid ${qty>0?'rgba(201,162,39,0.6)':C.border}`,
                borderRadius:14, padding:'16px 14px', textAlign:'left',
                position:'relative', minHeight:90, fontFamily:'inherit',
                transition:'all 0.1s', ...TAP }}>
                {qty > 0 && (
                  <div style={{ position:'absolute', top:10, right:10, background:C.gold,
                    color:C.bg, fontSize:13, fontWeight:700, width:28, height:28,
                    borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {qty}
                  </div>
                )}
                <div style={{color:C.ivory,fontSize:15,fontWeight:600,lineHeight:1.3}}>{item.name}</div>
                <div style={{color:C.gold,fontSize:13,marginTop:5}}>${item.price}</div>
                {item.opts.length>0 && (
                  <div style={{color:'rgba(201,162,39,0.5)',fontSize:11,marginTop:3}}>+ opciones</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#0d2010', borderTop:`2px solid rgba(201,162,39,0.25)`,
        padding:'12px 16px', flexShrink:0 }}>
        {order.length > 0 && (
          <div style={{ maxHeight:130, overflowY:'auto', marginBottom:10,
            WebkitOverflowScrolling:'touch' }}>
            {order.map(row => {
              const optStr = Object.entries(row.opts||{})
                .map(([,v])=>Array.isArray(v)?v.join(', '):v).filter(Boolean).join(' · ')
              return (
                <div key={row.key} style={{ display:'flex', alignItems:'center', gap:8,
                  padding:'5px 0', borderBottom:`1px solid rgba(201,162,39,0.08)` }}>
                  <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                    <button onClick={()=>changeQty(row.key,1)} style={{
                      background:'rgba(255,255,255,0.1)',border:'none',color:C.ivory,
                      width:32,height:32,borderRadius:8,fontSize:20,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:'inherit',...TAP}}>+</button>
                    <span style={{color:C.gold,fontWeight:700,fontSize:15,minWidth:20,textAlign:'center'}}>{row.qty}</span>
                    <button onClick={()=>changeQty(row.key,-1)} style={{
                      background:'rgba(255,255,255,0.1)',border:'none',color:C.ivory,
                      width:32,height:32,borderRadius:8,fontSize:20,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:'inherit',...TAP}}>−</button>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:C.ivory,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.name}</div>
                    {optStr&&<div style={{fontSize:11,color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{optStr}</div>}
                  </div>
                  <div style={{fontSize:13,color:C.gold,fontWeight:600,flexShrink:0}}>${row.price*row.qty}</div>
                </div>
              )
            })}
          </div>
        )}
        {sendErr && <div style={{color:C.red,fontSize:12,marginBottom:8}}>{sendErr}</div>}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:C.muted}}>Total {totalQty>0?`(${totalQty} items)`:''}</div>
            <div style={{fontSize:24,fontWeight:700,color:C.gold}}>${total}</div>
          </div>
          <button onClick={sendOrder} disabled={order.length===0||!mesa||sending} style={{
            background: order.length===0||!mesa?'rgba(201,162,39,0.3)':C.gold,
            border:'none', borderRadius:14, color:C.bg, fontSize:16, fontWeight:700,
            padding:'0 24px', height:56, whiteSpace:'nowrap', fontFamily:'inherit',
            transition:'all 0.15s', flexShrink:0, ...TAP }}>
            {sending?'Enviando…':mesa?`Enviar — Mesa ${mesa}`:'Elige mesa'}
          </button>
        </div>
      </div>

      {sheetItem && (
        <OptionsSheet
          item={sheetItem}
          onAdd={(opts) => { addItem(sheetItem, opts); setSheetItem(null) }}
          onClose={() => setSheetItem(null)}
        />
      )}
    </div>
  )
}
