const { useState, useRef } = React;

const genId = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];
const fmtFecha = iso => { if(!iso) return ""; const [y,m,d]=iso.split("-"); const meses=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]; return `${d} ${meses[+m-1]} ${y}`; };
const horaHoy = () => new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
const fmtMonto = n => n ? "$"+Math.round(n).toLocaleString("es-CL") : null;
const diasDesde = iso => { if(!iso) return 0; return Math.floor((Date.now()-new Date(iso).getTime())/(1000*60*60*24)); };

const STORAGE_KEY = 'bitacora_personas';
const cargarPersonas = () => { try { const d=localStorage.getItem(STORAGE_KEY); return d?JSON.parse(d):[]; } catch{ return []; } };
const guardarPersonas = ps => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ps)); } catch{} };

const CATEGORIAS = ["general","dinero","encargo","entrega","cobro","otro"];
const CAT_COLOR = {
  general:{bg:"#F1EFE8",text:"#444441",border:"#B4B2A9"},
  dinero: {bg:"#EAF3DE",text:"#27500A",border:"#97C459"},
  encargo:{bg:"#EEEDFE",text:"#3C3489",border:"#AFA9EC"},
  entrega:{bg:"#E6F1FB",text:"#0C447C",border:"#85B7EB"},
  cobro:  {bg:"#FAEEDA",text:"#633806",border:"#EF9F27"},
  otro:   {bg:"#FBEAF0",text:"#72243E",border:"#ED93B1"},
};
const PLANTILLAS = [
  {label:"Me pagó",     texto:"Me pagó ",     cat:"dinero", monto:true},
  {label:"Le presté",   texto:"Le presté ",   cat:"dinero", monto:true},
  {label:"Le cobré",    texto:"Le cobré ",    cat:"cobro",  monto:true},
  {label:"Me encargó",  texto:"Me encargó: ", cat:"encargo",monto:false},
  {label:"Le entregué", texto:"Le entregué: ",cat:"entrega",monto:false},
  {label:"Le pedí",     texto:"Le pedí: ",    cat:"encargo",monto:false},
];
const COLORES = ["#378ADD","#1D9E75","#D85A30","#D4537E","#7F77DD","#BA7517","#639922","#E24B4A"];
const SORT_OPS = [{val:"fecha_desc",label:"Más reciente"},{val:"fecha_asc",label:"Más antiguo"},{val:"monto_desc",label:"Mayor monto"},{val:"estado",label:"Pendientes primero"}];

function Avatar({ini,color,size=40}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:500,fontSize:size*0.35,color,flexShrink:0}}>{ini}</div>;
}
function Pill({cat,small}){
  const c=CAT_COLOR[cat]||CAT_COLOR.general;
  return <span style={{background:c.bg,color:c.text,border:`0.5px solid ${c.border}`,borderRadius:20,padding:small?"2px 8px":"3px 10px",fontSize:small?11:12,fontWeight:500}}>{cat}</span>;
}
function IcoSearch(){return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{display:"block"}}><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/><line x1="9.8" y1="9.8" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoX(){return <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{display:"block"}}><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;}
function IcoCheck(){return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{display:"block"}}><polyline points="2,7 5,10 11,3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoPending(){return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{display:"block"}}><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><line x1="6.5" y1="3.5" x2="6.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="6.5" cy="9" r="0.8" fill="currentColor"/></svg>;}
function IcoPin(){return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{display:"block"}}><path d="M6.5 1.5 L8.5 5.5 L11.5 6 L8.5 9 L9 12.5 L6.5 11 L4 12.5 L4.5 9 L1.5 6 L4.5 5.5 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>;}
function IcoNote(){return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{display:"block"}}><rect x="2" y="1.5" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="4" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="4" y1="7.5" x2="7.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;}

function hl(text,q){
  if(!q) return text;
  const idx=text.toLowerCase().indexOf(q.toLowerCase());
  if(idx===-1) return text;
  return React.createElement(React.Fragment,null,text.slice(0,idx),React.createElement("mark",null,text.slice(idx,idx+q.length)),text.slice(idx+q.length));
}

const OV={position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(5px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"1rem"};
const MB={background:"#fff",borderRadius:16,border:"0.5px solid #ccc",width:"min(96vw,480px)",maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"};
const MH={display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1.1rem 1.25rem 0.85rem",borderBottom:"0.5px solid #eee",position:"sticky",top:0,background:"#fff",borderRadius:"16px 16px 0 0",zIndex:1};
const MBd={padding:"1.25rem"};
const MF={display:"flex",gap:8,justifyContent:"flex-end",padding:"0.85rem 1.25rem 1.1rem",borderTop:"0.5px solid #eee",position:"sticky",bottom:0,background:"#fff",borderRadius:"0 0 16px 16px"};
const FL={fontSize:12,color:"#666",margin:"0 0 5px",display:"block"};
const FG={marginBottom:14};
const TA={width:"100%",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",fontSize:14,padding:"10px 12px",border:"0.5px solid #ccc",borderRadius:10,background:"#f5f5f0",color:"#1a1a1a",lineHeight:1.6,outline:"none"};

function exportarTexto(persona){
  const sal=persona.registros.reduce((t,r)=>{if(!r.monto)return t;if(r.cat==="dinero"||r.cat==="entrega")return t+r.monto;if(r.cat==="cobro")return t-r.monto;return t;},0);
  let txt=`BITÁCORA: ${persona.nombre}\n`;
  txt+=`Saldo total: ${sal>=0?"+":""}${fmtMonto(Math.abs(sal))}\n`;
  txt+=`Registros: ${persona.registros.length}\n`;
  if(persona.notaRapida) txt+=`Nota rápida: ${persona.notaRapida}\n`;
  txt+=`\n${"─".repeat(40)}\n\n`;
  persona.registros.forEach(r=>{
    txt+=`[${r.fecha}  ${r.hora}]  ${r.cat.toUpperCase()}  •  ${r.estado.toUpperCase()}\n`;
    txt+=`${r.texto}\n`;
    if(r.monto) txt+=`Monto: ${fmtMonto(r.monto)}\n`;
    txt+=`\n`;
  });
  const blob=new Blob([txt],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`bitacora_${persona.nombre.replace(/\s+/g,"_")}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

function App(){
  const [personas,setPersonasState]=useState(()=>cargarPersonas());
  const setPersonas=ps=>{const nuevo=typeof ps==="function"?ps(personas):ps; setPersonasState(nuevo); guardarPersonas(nuevo);};

  const [vista,setVista]=useState("lista");
  const [busqGlobal,setBusqGlobal]=useState("");
  const [busqActiva,setBusqActiva]=useState(false);
  const [busqPersona,setBusqPersona]=useState("");
  const [filtroPersona,setFiltroPersona]=useState(null);
  const [filtroEstado,setFiltroEstado]=useState(null);
  const [sortOrder,setSortOrder]=useState("fecha_desc");
  const [modal,setModal]=useState(null);
  const [formP,setFormP]=useState({nombre:"",color:COLORES[0]});
  const [formR,setFormR]=useState({texto:"",cat:"general",monto:"",estado:"pendiente",fecha:hoy(),imgs:[]});
  const [editRId,setEditRId]=useState(null);
  const [editNota,setEditNota]=useState(false);
  const [notaTemp,setNotaTemp]=useState("");
  const fileRef=useRef();

  const persona=personas.find(p=>p.id===vista);
  const saldo=p=>p.registros.reduce((t,r)=>{if(!r.monto)return t;if(r.cat==="dinero"||r.cat==="entrega")return t+r.monto;if(r.cat==="cobro")return t-r.monto;return t;},0);
  const pendientes=p=>p.registros.filter(r=>r.estado==="pendiente").length;
  const resumenGlobal=()=>({totalSaldo:personas.reduce((t,p)=>t+saldo(p),0),totalPend:personas.reduce((t,p)=>t+pendientes(p),0)});

  const crearPersona=()=>{
    if(!formP.nombre.trim())return;
    const ini=formP.nombre.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
    setPersonas(ps=>[...ps,{id:genId(),nombre:formP.nombre.trim(),iniciales:ini,color:formP.color,fijado:false,notaRapida:"",registros:[]}]);
    setModal(null);setFormP({nombre:"",color:COLORES[0]});
  };
  const eliminarPersona=id=>{setPersonas(ps=>ps.filter(p=>p.id!==id));setVista("lista");setModal(null);};
  const toggleFijado=id=>setPersonas(ps=>ps.map(p=>p.id===id?{...p,fijado:!p.fijado}:p));
  const guardarNota=pid=>{setPersonas(ps=>ps.map(p=>p.id===pid?{...p,notaRapida:notaTemp}:p));setEditNota(false);};

  const abrirNuevoReg=(pl=null)=>{
    if(pl) setFormR({texto:pl.texto,cat:pl.cat,monto:"",estado:"pendiente",fecha:hoy(),imgs:[]});
    else setFormR({texto:"",cat:"general",monto:"",estado:"pendiente",fecha:hoy(),imgs:[]});
    setEditRId(null);setModal("reg");
  };
  const abrirEditarReg=r=>{
    setFormR({texto:r.texto,cat:r.cat,monto:r.monto||"",estado:r.estado,fecha:r.fecha||hoy(),imgs:r.imgs||[]});
    setEditRId(r.id);setModal("reg");
  };
  const guardarReg=()=>{
    if(!formR.texto.trim()||!persona)return;
    const montoNum=formR.monto?parseFloat(String(formR.monto).replace(/\./g,"").replace(",",".")):null;
    setPersonas(ps=>ps.map(p=>{
      if(p.id!==persona.id)return p;
      if(editRId)return{...p,registros:p.registros.map(r=>r.id===editRId?{...r,texto:formR.texto,cat:formR.cat,monto:montoNum,estado:formR.estado,fecha:formR.fecha,imgs:formR.imgs}:r)};
      return{...p,registros:[{id:genId(),texto:formR.texto,cat:formR.cat,monto:montoNum,estado:formR.estado,fecha:formR.fecha,hora:horaHoy(),imgs:formR.imgs},...p.registros]};
    }));
    setModal(null);setEditRId(null);
  };
  const toggleEstado=(pid,rid)=>setPersonas(ps=>ps.map(p=>p.id!==pid?p:{...p,registros:p.registros.map(r=>r.id!==rid?r:{...r,estado:r.estado==="pendiente"?"resuelto":"pendiente"})}));
  const eliminarReg=(pid,rid)=>{setPersonas(ps=>ps.map(p=>p.id!==pid?p:{...p,registros:p.registros.filter(r=>r.id!==rid)}));setModal(null);};
  const handleImgs=e=>{Array.from(e.target.files).forEach(f=>{const rd=new FileReader();rd.onload=ev=>setFormR(fr=>({...fr,imgs:[...fr.imgs,{src:ev.target.result,nombre:f.name}]}));rd.readAsDataURL(f);});};

  const ordenarRegistros=regs=>{
    const arr=[...regs];
    if(sortOrder==="fecha_desc") return arr.sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
    if(sortOrder==="fecha_asc") return arr.sort((a,b)=>(a.fecha||"").localeCompare(b.fecha||""));
    if(sortOrder==="monto_desc") return arr.sort((a,b)=>(b.monto||0)-(a.monto||0));
    if(sortOrder==="estado") return arr.sort(a=>a.estado==="pendiente"?-1:1);
    return arr;
  };

  const registrosFiltrados=persona?ordenarRegistros(persona.registros.filter(r=>{
    const q=busqPersona.toLowerCase();
    return(!q||r.texto.toLowerCase().includes(q)||(r.monto&&String(r.monto).includes(q)))&&(!filtroPersona||r.cat===filtroPersona)&&(!filtroEstado||r.estado===filtroEstado);
  })):[];

  const resultadosGlobales=busqGlobal.trim()?personas.flatMap(p=>p.registros.filter(r=>r.texto.toLowerCase().includes(busqGlobal.toLowerCase())||(r.monto&&String(r.monto).includes(busqGlobal))).map(r=>({...r,_persona:p}))):[];
  const personasOrdenadas=[...personas].sort((a,b)=>a.fijado===b.fijado?0:a.fijado?-1:1);
  const {totalSaldo,totalPend}=resumenGlobal();

  if(busqActiva) return(
    <div style={{fontFamily:"inherit",padding:"1rem",maxWidth:680,margin:"0 auto",fontSize:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"#f0f0ea",border:"0.5px solid #bbb",borderRadius:24,padding:"8px 14px"}}>
          <span style={{color:"#888",display:"flex"}}><IcoSearch/></span>
          <input autoFocus type="text" placeholder="Buscar en toda la bitácora..." value={busqGlobal} onChange={e=>setBusqGlobal(e.target.value)}
            style={{border:"none",background:"transparent",outline:"none",flex:1,fontSize:14,color:"#1a1a1a",padding:0}}/>
          {busqGlobal&&<button onClick={()=>setBusqGlobal("")} style={{border:"none",background:"transparent",padding:0,display:"flex",color:"#888"}}><IcoX/></button>}
        </div>
        <button onClick={()=>{setBusqActiva(false);setBusqGlobal("");}}>Cancelar</button>
      </div>
      {busqGlobal&&resultadosGlobales.length===0&&<p style={{color:"#888",fontSize:13,textAlign:"center",marginTop:"3rem"}}>Sin resultados para "{busqGlobal}"</p>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {resultadosGlobales.map(r=>(
          <div key={r.id} onClick={()=>{setVista(r._persona.id);setBusqActiva(false);setBusqGlobal("");}} style={{background:"#fff",border:"0.5px solid #ddd",borderRadius:12,padding:"0.85rem 1rem",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <Avatar ini={r._persona.iniciales} color={r._persona.color} size={26}/>
              <span style={{fontSize:13,fontWeight:500}}>{r._persona.nombre}</span>
              <Pill cat={r.cat} small/>
              <span style={{marginLeft:"auto",fontSize:11,color:"#999"}}>{fmtFecha(r.fecha)}</span>
            </div>
            <p style={{fontSize:13,color:"#555",margin:0}}>{hl(r.texto,busqGlobal)}</p>
            {r.monto&&<p style={{fontSize:12,fontWeight:500,color:"#27500A",margin:"3px 0 0"}}>{fmtMonto(r.monto)}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  if(vista==="lista") return(
    <div style={{fontFamily:"inherit",padding:"1.5rem 1rem 3rem",maxWidth:680,margin:"0 auto",fontSize:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1.25rem"}}>
        <span style={{fontSize:20,fontWeight:500,flex:1}}>Bitácora</span>
        <button onClick={()=>setBusqActiva(true)} style={{display:"flex",alignItems:"center",gap:6,fontSize:13}}><IcoSearch/> Buscar</button>
        <button onClick={()=>setModal("persona")} style={{fontSize:13,fontWeight:500}}>+ Persona</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1.25rem"}}>
        <div style={{background:"#fff",borderRadius:12,padding:"1rem 1.1rem",border:"0.5px solid #eee"}}>
          <p style={{fontSize:11,color:"#888",margin:"0 0 4px"}}>Saldo total</p>
          <p style={{fontSize:22,fontWeight:500,margin:0,color:totalSaldo>0?"#27500A":totalSaldo<0?"#A32D2D":"#1a1a1a"}}>{totalSaldo===0?"$0":((totalSaldo>0?"+":"")+fmtMonto(Math.abs(totalSaldo)))}</p>
          <p style={{fontSize:11,color:"#aaa",margin:"3px 0 0"}}>entre {personas.length} persona{personas.length!==1?"s":""}</p>
        </div>
        <div style={{background:"#fff",borderRadius:12,padding:"1rem 1.1rem",border:"0.5px solid #eee"}}>
          <p style={{fontSize:11,color:"#888",margin:"0 0 4px"}}>Pendientes totales</p>
          <p style={{fontSize:22,fontWeight:500,margin:0,color:totalPend>0?"#633806":"#1a1a1a"}}>{totalPend}</p>
          <p style={{fontSize:11,color:"#aaa",margin:"3px 0 0"}}>en toda la bitácora</p>
        </div>
      </div>
      {personas.length===0&&<p style={{color:"#888",fontSize:13,textAlign:"center",marginTop:"3rem"}}>Sin personas. Agrega una.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {personasOrdenadas.map(p=>{
          const sal=saldo(p);const pend=pendientes(p);
          const maxDias=p.registros.filter(r=>r.estado==="pendiente").reduce((m,r)=>Math.max(m,diasDesde(r.fecha)),0);
          const alerta=maxDias>=7;
          return(
            <div key={p.id} style={{background:"#fff",border:`0.5px solid ${alerta?"#EF9F27":"#ddd"}`,borderRadius:14,overflow:"hidden"}}>
              <div onClick={()=>setVista(p.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"1rem 1.2rem",cursor:"pointer"}}>
                <Avatar ini={p.iniciales} color={p.color} size={46}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    <p style={{fontWeight:500,fontSize:15,margin:0}}>{p.nombre}</p>
                    {p.fijado&&<span style={{color:"#BA7517",display:"flex"}}><IcoPin/></span>}
                    {alerta&&<span style={{fontSize:10,background:"#FAEEDA",color:"#633806",border:"0.5px solid #EF9F27",borderRadius:20,padding:"1px 6px"}}>+{maxDias}d sin resolver</span>}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"#888"}}>{p.registros.length} registro{p.registros.length!==1?"s":""}</span>
                    {pend>0&&<span style={{fontSize:11,background:"#FAEEDA",color:"#633806",border:"0.5px solid #EF9F27",borderRadius:20,padding:"1px 7px"}}>{pend} pendiente{pend!==1?"s":""}</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  {sal!==0&&<p style={{fontSize:14,fontWeight:500,margin:"0 0 2px",color:sal>0?"#27500A":"#A32D2D"}}>{sal>0?"+":""}{fmtMonto(Math.abs(sal))}</p>}
                  {p.registros[0]&&<p style={{fontSize:11,color:"#aaa",margin:0}}>{fmtFecha(p.registros[0].fecha)}</p>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,padding:"0.5rem 1.2rem 0.75rem",borderTop:"0.5px solid #eee"}}>
                <button onClick={()=>toggleFijado(p.id)} style={{fontSize:11,display:"flex",alignItems:"center",gap:4,color:p.fijado?"#BA7517":"#888"}}><IcoPin/>{p.fijado?"Fijado":"Fijar"}</button>
                <button onClick={()=>exportarTexto(p)} style={{fontSize:11}}>Exportar</button>
              </div>
            </div>
          );
        })}
      </div>
      {modal==="persona"&&(
        <div style={OV} onClick={()=>setModal(null)}>
          <div style={MB} onClick={e=>e.stopPropagation()}>
            <div style={MH}><span style={{fontWeight:500,fontSize:15}}>Nueva persona</span><button onClick={()=>setModal(null)} style={{border:"none",background:"#f0f0ea",padding:"5px 8px",borderRadius:8,display:"flex"}}><IcoX/></button></div>
            <div style={MBd}>
              <div style={FG}><label style={FL}>Nombre completo</label><input type="text" placeholder="Ej: Juan Carlos Rojas" value={formP.nombre} onChange={e=>setFormP(f=>({...f,nombre:e.target.value}))} style={{width:"100%"}}/></div>
              <div style={FG}><label style={FL}>Color del avatar</label><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>{COLORES.map(c=><div key={c} onClick={()=>setFormP(f=>({...f,color:c}))} style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:formP.color===c?"3px solid #333":"2px solid transparent"}}/>)}</div></div>
            </div>
            <div style={MF}><button onClick={()=>setModal(null)}>Cancelar</button><button onClick={crearPersona} style={{fontWeight:500}}>Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );

  const sal=saldo(persona);const pend=pendientes(persona);
  const maxDiasP=persona.registros.filter(r=>r.estado==="pendiente").reduce((m,r)=>Math.max(m,diasDesde(r.fecha)),0);

  return(
    <div style={{fontFamily:"inherit",padding:"1.5rem 1rem 3rem",maxWidth:680,margin:"0 auto",fontSize:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1.25rem"}}>
        <button onClick={()=>{setVista("lista");setFiltroPersona(null);setFiltroEstado(null);setBusqPersona("");setSortOrder("fecha_desc");}}>← Volver</button>
        <Avatar ini={persona.iniciales} color={persona.color} size={38}/>
        <span style={{fontSize:16,fontWeight:500,flex:1}}>{persona.nombre}</span>
        <button onClick={()=>setBusqActiva(true)} style={{display:"flex",alignItems:"center",padding:"6px 8px",border:"0.5px solid #ddd",borderRadius:8}}><IcoSearch/></button>
        <button onClick={()=>exportarTexto(persona)} style={{fontSize:12}}>Exportar</button>
        <button onClick={()=>abrirNuevoReg()} style={{fontSize:13,fontWeight:500}}>+ Registro</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:"1rem"}}>
        {[
          {label:"Saldo",val:sal===0?"$0":((sal>0?"+":"")+fmtMonto(Math.abs(sal))),color:sal>0?"#27500A":sal<0?"#A32D2D":"#1a1a1a"},
          {label:"Registros",val:persona.registros.length,color:"#1a1a1a"},
          {label:"Pendientes",val:pend,color:pend>0?"#633806":"#1a1a1a"},
        ].map(m=>(
          <div key={m.label} style={{background:"#fff",borderRadius:10,padding:"0.75rem 1rem",border:"0.5px solid #eee"}}>
            <p style={{fontSize:11,color:"#888",margin:"0 0 3px"}}>{m.label}</p>
            <p style={{fontSize:18,fontWeight:500,margin:0,color:m.color}}>{m.val}</p>
          </div>
        ))}
      </div>
      {maxDiasP>=7&&<div style={{background:"#FAEEDA",border:"0.5px solid #EF9F27",borderRadius:10,padding:"8px 14px",marginBottom:"1rem",fontSize:12,color:"#633806",display:"flex",alignItems:"center",gap:6}}><IcoPending/> Hay registros pendientes con más de {maxDiasP} días sin resolver.</div>}
      <div style={{background:"#fff",borderRadius:12,padding:"0.85rem 1rem",marginBottom:"1rem",border:"0.5px solid #eee"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
          <span style={{display:"flex",color:"#888"}}><IcoNote/></span>
          <span style={{fontSize:12,fontWeight:500,color:"#888"}}>Nota rápida</span>
          {!editNota&&<button onClick={()=>{setNotaTemp(persona.notaRapida||"");setEditNota(true);}} style={{marginLeft:"auto",fontSize:11}}>Editar</button>}
        </div>
        {editNota?(
          <><textarea value={notaTemp} onChange={e=>setNotaTemp(e.target.value)} rows={2} placeholder="Ej: Llamar la próxima semana..." style={{...TA,marginBottom:8}}/><div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><button onClick={()=>setEditNota(false)} style={{fontSize:11}}>Cancelar</button><button onClick={()=>guardarNota(persona.id)} style={{fontSize:11,fontWeight:500}}>Guardar</button></div></>
        ):(
          <p style={{fontSize:13,color:persona.notaRapida?"#1a1a1a":"#bbb",margin:0,lineHeight:1.6}}>{persona.notaRapida||"Sin nota. Toca editar para agregar una."}</p>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"0.85rem",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:140,display:"flex",alignItems:"center",gap:8,background:"#f0f0ea",border:"0.5px solid #ddd",borderRadius:20,padding:"6px 12px"}}>
          <span style={{color:"#888",display:"flex"}}><IcoSearch/></span>
          <input type="text" placeholder="Buscar aquí..." value={busqPersona} onChange={e=>setBusqPersona(e.target.value)} style={{border:"none",background:"transparent",outline:"none",fontSize:13,color:"#1a1a1a",width:"100%",padding:0}}/>
          {busqPersona&&<button onClick={()=>setBusqPersona("")} style={{border:"none",background:"transparent",padding:0,display:"flex",color:"#888"}}><IcoX/></button>}
        </div>
        <select value={filtroPersona||""} onChange={e=>setFiltroPersona(e.target.value||null)} style={{fontSize:12,padding:"5px 8px",borderRadius:20}}><option value="">Categoría</option>{CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <select value={filtroEstado||""} onChange={e=>setFiltroEstado(e.target.value||null)} style={{fontSize:12,padding:"5px 8px",borderRadius:20}}><option value="">Estado</option><option value="pendiente">Pendiente</option><option value="resuelto">Resuelto</option></select>
        <select value={sortOrder} onChange={e=>setSortOrder(e.target.value)} style={{fontSize:12,padding:"5px 8px",borderRadius:20}}>{SORT_OPS.map(s=><option key={s.val} value={s.val}>{s.label}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:"1.1rem"}}>
        {PLANTILLAS.map(pl=><button key={pl.label} onClick={()=>abrirNuevoReg(pl)} style={{fontSize:12}}>{pl.label}</button>)}
      </div>
      {registrosFiltrados.length===0&&<p style={{color:"#888",fontSize:13,textAlign:"center",marginTop:"2rem"}}>Sin registros.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {registrosFiltrados.map((reg,i)=>(
          <div key={reg.id} style={{display:"flex",gap:12}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:20,flexShrink:0}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:reg.estado==="resuelto"?"#639922":persona.color,marginTop:18,flexShrink:0}}/>
              {i<registrosFiltrados.length-1&&<div style={{width:2,flex:1,background:"#eee",minHeight:20}}/>}
            </div>
            <div style={{flex:1,background:"#fff",border:`0.5px solid ${reg.estado==="resuelto"?"#eee":"#ccc"}`,borderRadius:12,padding:"0.85rem 1rem",marginBottom:10,opacity:reg.estado==="resuelto"?0.72:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                <Pill cat={reg.cat} small/>
                {reg.estado==="resuelto"?<span style={{fontSize:11,background:"#EAF3DE",color:"#27500A",border:"0.5px solid #97C459",borderRadius:20,padding:"1px 7px",display:"flex",alignItems:"center",gap:3}}><IcoCheck/> resuelto</span>:<span style={{fontSize:11,background:"#FAEEDA",color:"#633806",border:"0.5px solid #EF9F27",borderRadius:20,padding:"1px 7px",display:"flex",alignItems:"center",gap:3}}><IcoPending/> pendiente</span>}
                <span style={{marginLeft:"auto",fontSize:11,color:"#aaa"}}>{fmtFecha(reg.fecha)} · {reg.hora}</span>
              </div>
              <p style={{fontSize:14,color:"#1a1a1a",margin:"0 0 4px",lineHeight:1.6,cursor:"pointer"}} onClick={()=>setModal({tipo:"ver",reg,pid:persona.id})}>{hl(reg.texto,busqPersona)}</p>
              {reg.monto&&<p style={{fontSize:13,fontWeight:500,margin:"2px 0 6px",color:reg.cat==="cobro"?"#A32D2D":"#27500A"}}>{reg.cat==="cobro"?"-":""}{fmtMonto(reg.monto)}</p>}
              {reg.imgs&&reg.imgs.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>{reg.imgs.map((img,idx)=><img key={idx} src={img.src} alt={img.nombre} style={{width:56,height:56,objectFit:"cover",borderRadius:8,border:"0.5px solid #eee",cursor:"pointer"}} onClick={()=>setModal({tipo:"ver",reg,pid:persona.id})}/>)}</div>}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>toggleEstado(persona.id,reg.id)} style={{fontSize:11}}>{reg.estado==="pendiente"?"✓ Resolver":"Reabrir"}</button>
                <button onClick={()=>abrirEditarReg(reg)} style={{fontSize:11}}>Editar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",marginTop:"1.25rem"}}>
        <button onClick={()=>{if(confirm(`¿Eliminar a ${persona.nombre}?`))eliminarPersona(persona.id);}} style={{fontSize:11,color:"#c0392b"}}>Eliminar persona</button>
      </div>
      {modal&&modal.tipo==="ver"&&(
        <div style={OV} onClick={()=>setModal(null)}>
          <div style={MB} onClick={e=>e.stopPropagation()}>
            <div style={MH}><div style={{display:"flex",alignItems:"center",gap:8}}><Pill cat={modal.reg.cat}/>{modal.reg.estado==="resuelto"?<span style={{fontSize:11,background:"#EAF3DE",color:"#27500A",border:"0.5px solid #97C459",borderRadius:20,padding:"1px 7px",display:"flex",alignItems:"center",gap:3}}><IcoCheck/> resuelto</span>:<span style={{fontSize:11,background:"#FAEEDA",color:"#633806",border:"0.5px solid #EF9F27",borderRadius:20,padding:"1px 7px",display:"flex",alignItems:"center",gap:3}}><IcoPending/> pendiente</span>}</div><button onClick={()=>setModal(null)} style={{border:"none",background:"#f0f0ea",padding:"5px 8px",borderRadius:8,display:"flex"}}><IcoX/></button></div>
            <div style={MBd}>
              <p style={{fontSize:15,color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{modal.reg.texto}</p>
              {modal.reg.monto&&<p style={{fontSize:15,fontWeight:500,margin:"0 0 6px",color:modal.reg.cat==="cobro"?"#A32D2D":"#27500A"}}>{modal.reg.cat==="cobro"?"-":""}{fmtMonto(modal.reg.monto)}</p>}
              <p style={{fontSize:12,color:"#aaa",margin:"0 0 12px"}}>{fmtFecha(modal.reg.fecha)} · {modal.reg.hora}</p>
              {modal.reg.imgs&&modal.reg.imgs.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>{modal.reg.imgs.map((img,idx)=><img key={idx} src={img.src} alt={img.nombre} style={{maxWidth:"100%",maxHeight:200,objectFit:"contain",borderRadius:10,border:"0.5px solid #eee"}}/>)}</div>}
            </div>
            <div style={MF}>
              <button onClick={()=>{toggleEstado(modal.pid,modal.reg.id);setModal(null);}} style={{fontSize:12}}>{modal.reg.estado==="pendiente"?"✓ Resolver":"Reabrir"}</button>
              <button onClick={()=>abrirEditarReg(modal.reg)} style={{fontSize:12}}>Editar</button>
              <button onClick={()=>eliminarReg(modal.pid,modal.reg.id)} style={{fontSize:12,color:"#c0392b"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {modal==="reg"&&(
        <div style={OV} onClick={()=>setModal(null)}>
          <div style={MB} onClick={e=>e.stopPropagation()}>
            <div style={MH}><span style={{fontWeight:500,fontSize:15}}>{editRId?"Editar registro":"Nuevo registro"}</span><button onClick={()=>setModal(null)} style={{border:"none",background:"#f0f0ea",padding:"5px 8px",borderRadius:8,display:"flex"}}><IcoX/></button></div>
            <div style={MBd}>
              <div style={FG}><label style={FL}>Descripción</label><textarea placeholder="Escribe aquí el detalle..." value={formR.texto} onChange={e=>setFormR(f=>({...f,texto:e.target.value}))} rows={4} style={TA}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div><label style={FL}>Categoría</label><select value={formR.cat} onChange={e=>setFormR(f=>({...f,cat:e.target.value}))} style={{width:"100%",fontSize:13}}>{CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div><label style={FL}>Estado</label><select value={formR.estado} onChange={e=>setFormR(f=>({...f,estado:e.target.value}))} style={{width:"100%",fontSize:13}}><option value="pendiente">Pendiente</option><option value="resuelto">Resuelto</option></select></div>
              </div>
              <div style={FG}><label style={FL}>Fecha del evento</label><input type="date" value={formR.fecha} onChange={e=>setFormR(f=>({...f,fecha:e.target.value}))} style={{width:"100%",fontSize:13}}/></div>
              <div style={FG}><label style={FL}>Monto en $ (opcional)</label><input type="text" inputMode="numeric" placeholder="Ej: 50000" value={formR.monto} onChange={e=>setFormR(f=>({...f,monto:e.target.value.replace(/[^0-9]/g,"")}))} style={{width:"100%",fontSize:14}}/></div>
              <div><label style={FL}>Imágenes (opcional)</label><input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleImgs}/><button onClick={()=>fileRef.current.click()} style={{fontSize:12}}>+ Adjuntar imagen</button>{formR.imgs.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>{formR.imgs.map((img,idx)=><div key={idx} style={{position:"relative"}}><img src={img.src} alt={img.nombre} style={{width:62,height:62,objectFit:"cover",borderRadius:8,border:"0.5px solid #eee"}}/><button onClick={()=>setFormR(f=>({...f,imgs:f.imgs.filter((_,i)=>i!==idx)}))} style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",padding:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",border:"0.5px solid #ccc"}}><IcoX/></button></div>)}</div>}</div>
            </div>
            <div style={MF}><button onClick={()=>setModal(null)}>Cancelar</button><button onClick={guardarReg} style={{fontWeight:500}}>Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
