import { useState, useEffect, useRef } from "react";

const ParticleField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 45 }, () => ({ x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25, r:Math.random()*1.2+.3 }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle="rgba(56,189,248,.3)"; ctx.fill(); });
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{ const d=Math.hypot(a.x-b.x,a.y-b.y); if(d<120){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle=`rgba(56,189,248,${.06*(1-d/120)})`; ctx.lineWidth=.5; ctx.stroke(); } }));
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}} />;
};

const Gear = ({ size=60, speed=8, color="#38bdf8", opacity=.1, reverse=false }) => {
  const teeth=10,r=size/2,ri=r*.68,rt=r*.88,pts=[];
  for(let i=0;i<teeth;i++){const a=(i/teeth)*Math.PI*2,aw=Math.PI/teeth*.55;pts.push(`${rt*Math.cos(a-aw)},${rt*Math.sin(a-aw)}`);pts.push(`${r*Math.cos(a-aw*.3)},${r*Math.sin(a-aw*.3)}`);pts.push(`${r*Math.cos(a+aw*.3)},${r*Math.sin(a+aw*.3)}`);pts.push(`${rt*Math.cos(a+aw)},${rt*Math.sin(a+aw)}`);}
  return <svg width={size*2} height={size*2} viewBox={`${-size} ${-size} ${size*2} ${size*2}`} style={{animation:`${reverse?"spinR":"spinF"} ${speed}s linear infinite`,display:"block"}}><polygon points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" opacity={opacity}/><circle cx={0} cy={0} r={ri} fill="none" stroke={color} strokeWidth="1" opacity={opacity}/><circle cx={0} cy={0} r={r*.22} fill={color} opacity={opacity*.8}/></svg>;
};

const useTyping = (text, speed=14) => {
  const [displayed,setDisplayed]=useState(""); const [done,setDone]=useState(false);
  useEffect(()=>{ setDisplayed(""); setDone(false); let i=0; const t=setInterval(()=>{ i++; setDisplayed(text.slice(0,i)); if(i>=text.length){clearInterval(t);setDone(true);} },speed); return()=>clearInterval(t); },[text]);
  return {displayed,done};
};

const CATS = [
  "📱 موبایل و تبلت","💻 لپ‌تاپ","🖥️ کامپیوتر رومیزی","❄️ یخچال و فریزر","🌬️ کولر گازی",
  "💨 کولر آبی","🌡️ پکیج و شوفاژ","🫧 ماشین لباسشویی","🍽️ ماشین ظرفشویی","🍳 اجاق گاز",
  "🔥 فر و مایکروویو","📺 تلویزیون","🎮 کنسول بازی","🖨️ پرینتر و اسکنر","📷 دوربین عکاسی",
  "🎵 سیستم صوتی","🌀 جاروبرقی","👕 اتو و بخارشوی","☕ قهوه‌ساز و چای‌ساز","🥤 آبمیوه‌گیر و مخلوط‌کن",
  "🔌 برق و سیم‌کشی","🚿 لوله‌کشی و آبسردکن","🚗 لوازم خودرو","🔋 باتری و UPS",
  "⌚ ساعت و جواهرات","🪟 درب و پنجره و قفل","🛁 وان و جکوزی","💡 روشنایی و LED",
  "📡 آنتن و ماهواره","🔧 سایر تجهیزات"
];

const CITIES = ["تهران","اصفهان","شیراز","مشهد","تبریز","کرج","اهواز","قم","رشت","کرمانشاه","همدان","ارومیه","زاهدان","بندرعباس","اراک","اصفهان","گرگان","سمنان","یزد","بوشهر","سایر"];
const SUGGESTIONS = ["یخچالم برفک می‌زنه","گوشیم شارژ نمیگیره","ماشین لباسشویی آب نمیکشه","کولر گازی سرد نمی‌کنه","لپ‌تاپم روشن نمیشه","تلویزیونم تصویر نداره","پکیجم آب گرم نمیده","جاروبرقیم مک نمیکشه"];

const MapPicker = ({ lat, lng, onPick, readonly=false, markers=[] }) => {
  const mapRef = useRef(null); const instanceRef = useRef(null); const markerRef = useRef(null);
  useEffect(() => {
    if (!window.L) return;
    const L = window.L;
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current=null; }
    const map = L.map(mapRef.current, { zoomControl: true }).setView([lat||35.6892,lng||51.389],lat?14:10);
    instanceRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM",maxZoom:19}).addTo(map);
    const icon = L.divIcon({ className:"", html:`<div style="width:28px;height:28px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 3px 10px rgba(14,165,233,.6)"></div>`, iconSize:[28,28], iconAnchor:[14,28] });
    if(lat&&lng){ markerRef.current=L.marker([lat,lng],{icon}).addTo(map); }
    markers.forEach(m => {
      const mi = L.divIcon({ className:"", html:`<div style="width:24px;height:24px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 3px 8px rgba(245,158,11,.5)"></div>`, iconSize:[24,24], iconAnchor:[12,24] });
      L.marker([m.lat,m.lng],{icon:mi}).addTo(map).bindPopup(`<b>${m.name}</b><br/>${m.city}`);
    });
    if(!readonly){ map.on("click",e=>{ const {lat:la,lng:ln}=e.latlng; if(markerRef.current)map.removeLayer(markerRef.current); markerRef.current=L.marker([la,ln],{icon}).addTo(map); onPick&&onPick(la,ln); }); }
    return () => { map.remove(); instanceRef.current=null; };
  }, [lat,lng,readonly,markers.length]);
  return <div ref={mapRef} style={{width:"100%",height:"100%",borderRadius:12}} />;
};

const LeafletLoader = ({ children }) => {
  const [ready,setReady]=useState(!!window.L);
  useEffect(()=>{
    if(window.L){setReady(true);return;}
    const css=document.createElement("link"); css.rel="stylesheet"; css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(css);
    const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.onload=()=>setReady(true); document.head.appendChild(s);
  },[]);
  if(!ready) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:13}}>در حال بارگذاری نقشه...</div>;
  return children;
};

const Field = ({label,value,onChange,placeholder,multiline,type="text"}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",color:"#475569",fontSize:11,marginBottom:5,letterSpacing:1.2,textTransform:"uppercase"}}>{label}</label>
    {multiline
      ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{width:"100%",background:"#0a0f1e",border:"1px solid rgba(56,189,248,.12)",borderRadius:10,color:"#e2e8f0",padding:"10px 13px",fontSize:13,fontFamily:"Vazirmatn,sans-serif",resize:"vertical",outline:"none",boxSizing:"border-box",transition:"all .2s",lineHeight:1.7}} onFocus={e=>{e.target.style.borderColor="rgba(56,189,248,.4)";e.target.style.boxShadow="0 0 0 3px rgba(56,189,248,.08)";}} onBlur={e=>{e.target.style.borderColor="rgba(56,189,248,.12)";e.target.style.boxShadow="none";}}/>
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:"#0a0f1e",border:"1px solid rgba(56,189,248,.12)",borderRadius:10,color:"#e2e8f0",padding:"10px 13px",fontSize:13,fontFamily:"Vazirmatn,sans-serif",outline:"none",boxSizing:"border-box",transition:"all .2s"}} onFocus={e=>{e.target.style.borderColor="rgba(56,189,248,.4)";e.target.style.boxShadow="0 0 0 3px rgba(56,189,248,.08)";}} onBlur={e=>{e.target.style.borderColor="rgba(56,189,248,.12)";e.target.style.boxShadow="none";}}/>
    }
  </div>
);

const Select = ({label,value,onChange,options}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",color:"#475569",fontSize:11,marginBottom:5,letterSpacing:1.2,textTransform:"uppercase"}}>{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:"#0a0f1e",border:"1px solid rgba(56,189,248,.12)",borderRadius:10,color:"#e2e8f0",padding:"10px 13px",fontSize:13,fontFamily:"Vazirmatn,sans-serif",outline:"none",boxSizing:"border-box",cursor:"pointer",appearance:"none"}}>
      <option value="">انتخاب کنید...</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default function Taamiryar() {
  const [tab,setTab]=useState("home");
  const [shops,setShops]=useState([]);
  const [loadingShops,setLoadingShops]=useState(true);
  const [query,setQuery]=useState(""); const [selCat,setSelCat]=useState(null);
  const [diagPhase,setDiagPhase]=useState("idle");
  const [diagResult,setDiagResult]=useState("");
  const [loadDots,setLoadDots]=useState(0);
  const { displayed, done } = useTyping(diagResult,13);
  const [form,setForm]=useState({name:"",owner:"",phone:"",telegram:"",instagram:"",city:"",address:"",services:[],lat:null,lng:null,desc:""});
  const [regStep,setRegStep]=useState(0);
  const [saving,setSaving]=useState(false);
  const [findCity,setFindCity]=useState(""); const [findCat,setFindCat]=useState("");
  const [findResults,setFindResults]=useState(null);
  const [userLat,setUserLat]=useState(null); const [userLng,setUserLng]=useState(null);
  const [locLoading,setLocLoading]=useState(false);
  const [showTip,setShowTip]=useState(false); const [tipAmt,setTipAmt]=useState(""); const [tipDone,setTipDone]=useState(false);
  const [mounted,setMounted]=useState(false);

  useEffect(()=>{ setTimeout(()=>setMounted(true),80); },[]);

  useEffect(()=>{
    const load = async () => {
      setLoadingShops(true);
      try { const r=await window.storage.get("taamiryar_shops"); if(r&&r.value)setShops(JSON.parse(r.value)); } catch(e){ setShops([]); }
      setLoadingShops(false);
    };
    load();
  },[]);

  useEffect(()=>{ if(diagPhase!=="loading")return; const t=setInterval(()=>setLoadDots(d=>(d+1)%4),380); return()=>clearInterval(t); },[diagPhase]);

  const saveShops = async (s) => { setShops(s); try{ await window.storage.set("taamiryar_shops",JSON.stringify(s)); }catch(e){} };
  const formSet = k => v => setForm(p=>({...p,[k]:v}));
  const toggleService = s => setForm(p=>({...p,services:p.services.includes(s)?p.services.filter(x=>x!==s):[...p.services,s]}));

  const submitShop = async () => {
    if(!form.name||!form.phone||!form.city)return;
    setSaving(true);
    const shop={...form,id:Date.now(),createdAt:new Date().toISOString()};
    await saveShops([...shops,shop]);
    setSaving(false); setRegStep(3);
  };

  const diagnose = async (q=query) => {
    const fq=(selCat?`[${selCat}] `:"")+q;
    if(!fq.trim())return;
    setDiagPhase("loading"); setDiagResult("");
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`تو متخصص تعمیرات حرفه‌ای هستی. مشکل: ${fq}\n\nپاسخ فارسی روان:\n۱. **تشخیص احتمالی**\n۲. **دلایل رایج** (بولت)\n۳. **راه‌حل اولیه** (گام به گام)\n۴. **تخمین هزینه**\n۵. **توصیه نهایی**\nکوتاه، مفید، با ایموجی.`}]})});
      const data=await res.json();
      setDiagResult(data.content?.[0]?.text||"خطایی رخ داد.");
    } catch { setDiagResult("خطا در اتصال."); }
    setDiagPhase("result");
  };

  const getUserLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(p=>{ setUserLat(p.coords.latitude); setUserLng(p.coords.longitude); setLocLoading(false); },()=>setLocLoading(false));
  };

  const dist = (a,b,c,d) => { const R=6371,dLat=(c-a)*Math.PI/180,dLon=(d-b)*Math.PI/180,x=Math.sin(dLat/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); };

  const doFind = () => {
    let res=[...shops];
    if(findCity)res=res.filter(s=>s.city===findCity);
    if(findCat)res=res.filter(s=>s.services.some(sv=>sv===findCat));
    if(userLat&&userLng)res=res.map(s=>({...s,distance:s.lat&&s.lng?dist(userLat,userLng,s.lat,s.lng):null})).sort((a,b)=>(a.distance||999)-(b.distance||999));
    setFindResults(res);
  };

  const S = {
    card:{background:"rgba(255,255,255,.02)",border:"1px solid rgba(56,189,248,.1)",borderRadius:16,padding:"20px",backdropFilter:"blur(8px)"},
    btn:(active)=>({background:active?"linear-gradient(135deg,#0ea5e9,#6366f1)":"transparent",border:`1px solid ${active?"transparent":"rgba(56,189,248,.15)"}`,color:active?"#fff":"#64748b",borderRadius:10,padding:"10px 20px",fontFamily:"Vazirmatn,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",boxShadow:active?"0 4px 20px rgba(14,165,233,.35)":"none"}),
    gradText:{background:"linear-gradient(90deg,#38bdf8,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  };

  const tabs=[{id:"home",icon:"🏠",label:"خانه"},{id:"diagnose",icon:"🔍",label:"تشخیص"},{id:"find",icon:"📍",label:"تعمیرگاه"},{id:"register",icon:"✏️",label:"ثبت‌نام"}];

  return (
    <div style={{minHeight:"100vh",background:"#030712",fontFamily:"Vazirmatn,sans-serif",direction:"rtl",color:"#f1f5f9",position:"relative",paddingBottom:80}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;900&family=Orbitron:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::placeholder{color:#1e3a4a !important}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#0e4f6a;border-radius:2px}
        @keyframes spinF{to{transform:rotate(360deg)}}
        @keyframes spinR{to{transform:rotate(-360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(14,165,233,.3)}50%{box-shadow:0 0 45px rgba(14,165,233,.6)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.5);opacity:0}}
        select option{background:#0a0f1e}
      `}</style>

      <ParticleField />
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)"}}/>
      <div style={{position:"fixed",top:-200,right:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(14,165,233,.08) 0%,transparent 65%)",zIndex:0,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:-150,left:-100,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 65%)",zIndex:0,pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:60,left:-30,zIndex:1,pointerEvents:"none"}}><Gear size={65} speed={18} color="#38bdf8" opacity={.08}/></div>
      <div style={{position:"fixed",bottom:100,right:-20,zIndex:1,pointerEvents:"none"}}><Gear size={80} speed={22} color="#38bdf8" opacity={.06} reverse/></div>

      {/* Header */}
      <header style={{position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(56,189,248,.07)",backdropFilter:"blur(24px)",background:"rgba(3,7,18,.85)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#0ea5e9,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,animation:"pulseGlow 3s ease-in-out infinite"}}>🔧</div>
          <div>
            <div style={{fontSize:18,fontWeight:900,fontFamily:"Orbitron,sans-serif",background:"linear-gradient(90deg,#38bdf8,#818cf8,#38bdf8)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradShift 4s linear infinite"}}>taamiryar</div>
            <div style={{fontSize:9,color:"#1e4a6a",letterSpacing:2,textTransform:"uppercase"}}>دستیار هوشمند تعمیرات</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:"#1e3a4a"}}>{shops.length} تعمیرگاه</span>
          <button onClick={()=>setShowTip(true)} style={{background:"transparent",border:"1px solid rgba(56,189,248,.18)",color:"#38bdf8",borderRadius:20,padding:"6px 14px",fontFamily:"Vazirmatn,sans-serif",fontSize:11,cursor:"pointer",fontWeight:600,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(56,189,248,.08)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>☕ حمایت</button>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"rgba(3,7,18,.95)",backdropFilter:"blur(24px)",borderTop:"1px solid rgba(56,189,248,.08)",display:"flex",padding:"8px 0 12px"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",transition:"all .2s"}}>
            <span style={{fontSize:18,filter:tab===t.id?"none":"grayscale(0.8)",opacity:tab===t.id?1:.4,transition:"all .2s"}}>{t.icon}</span>
            <span style={{fontSize:9,fontFamily:"Vazirmatn,sans-serif",color:tab===t.id?"#38bdf8":"#334155",fontWeight:tab===t.id?700:400,transition:"all .2s",letterSpacing:.5}}>{t.label}</span>
            {tab===t.id&&<div style={{width:20,height:2,background:"linear-gradient(90deg,#38bdf8,#818cf8)",borderRadius:1}}/>}
          </button>
        ))}
      </nav>

      <main style={{position:"relative",zIndex:5,maxWidth:680,margin:"0 auto",padding:"20px 16px 20px",opacity:mounted?1:0,transform:mounted?"none":"translateY(16px)",transition:"all .5s cubic-bezier(.22,1,.36,1)"}}>

        {/* HOME */}
        {tab==="home"&&(
          <div style={{animation:"fadeUp .5s ease"}}>
            <div style={{textAlign:"center",padding:"32px 0 28px"}}>
              <div style={{position:"relative",display:"inline-block",marginBottom:20}}>
                <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#0c2a3a,#0e1a3a)",border:"1px solid rgba(56,189,248,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto",boxShadow:"0 0 40px rgba(14,165,233,.15)",animation:"float 4s ease-in-out infinite"}}>🔧</div>
                {[1,2].map(i=><div key={i} style={{position:"absolute",inset:-8*i,borderRadius:20+8*i,border:"1px solid rgba(56,189,248,.1)",animation:`ripple ${1.8+i*.6}s ease-out ${i*.4}s infinite`,pointerEvents:"none"}}/>)}
              </div>
              <h1 style={{fontSize:28,fontWeight:900,fontFamily:"Orbitron,sans-serif",marginBottom:10,background:"linear-gradient(135deg,#f1f5f9 30%,#38bdf8 70%,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>taamiryar.com</h1>
              <p style={{color:"#334155",fontSize:13,lineHeight:1.9,maxWidth:400,margin:"0 auto"}}>تشخیص هوشمند مشکل دستگاه + یافتن نزدیک‌ترین تعمیرگاه</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {icon:"🔍",title:"تشخیص AI",desc:"مشکل دستگاهت رو بگو، راه‌حل بگیر",tab:"diagnose",color:"#0ea5e9"},
                {icon:"📍",title:"یافتن تعمیرگاه",desc:"نزدیک‌ترین تعمیرگاه رو پیدا کن",tab:"find",color:"#6366f1"},
                {icon:"✏️",title:"ثبت تعمیرگاه",desc:"تعمیرگاهت رو ثبت کن، مشتری بگیر",tab:"register",color:"#f59e0b"},
                {icon:"📊",title:`${shops.length} تعمیرگاه`,desc:"در سراسر ایران ثبت شده",tab:"find",color:"#10b981"},
              ].map(c=>(
                <button key={c.title} onClick={()=>setTab(c.tab)} style={{...S.card,border:`1px solid ${c.color}22`,cursor:"pointer",textAlign:"right",transition:"all .25s",padding:"16px"}} onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${c.color}44`;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}15`;}} onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${c.color}22`;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                  <div style={{fontSize:24,marginBottom:8}}>{c.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>{c.title}</div>
                  <div style={{fontSize:11,color:"#334155",lineHeight:1.6}}>{c.desc}</div>
                </button>
              ))}
            </div>
            {shops.length>0&&(
              <div style={S.card}>
                <div style={{fontSize:11,color:"#38bdf8",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>آخرین تعمیرگاه‌های ثبت‌شده</div>
                {shops.slice(-3).reverse().map(s=>(
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(56,189,248,.05)"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,rgba(14,165,233,.15),rgba(99,102,241,.15))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔧</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"#334155"}}>{s.city} · {s.services.slice(0,2).join("، ")}</div>
                    </div>
                    <div style={{fontSize:11,color:"#38bdf8",background:"rgba(56,189,248,.08)",borderRadius:8,padding:"4px 8px",whiteSpace:"nowrap"}}>{s.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIAGNOSE */}
        {tab==="diagnose"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:900,fontFamily:"Orbitron,sans-serif",marginBottom:6,...S.gradText}}>تشخیص هوشمند</h2>
              <p style={{color:"#334155",fontSize:12}}>مشکل دستگاهت رو بگو — AI تشخیص می‌ده</p>
            </div>
            {diagPhase==="idle"&&(
              <>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                  {CATS.map(c=>(
                    <button key={c} onClick={()=>setSelCat(selCat===c?null:c)} style={{background:selCat===c?"rgba(56,189,248,.15)":"rgba(255,255,255,.02)",border:`1px solid ${selCat===c?"rgba(56,189,248,.4)":"rgba(255,255,255,.06)"}`,color:selCat===c?"#38bdf8":"#475569",borderRadius:20,padding:"6px 12px",fontSize:11,fontFamily:"Vazirmatn,sans-serif",cursor:"pointer",transition:"all .2s"}}>{c}</button>
                  ))}
                </div>
                <div style={{...S.card,marginBottom:14,padding:"6px"}}>
                  <textarea value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();diagnose();}}} placeholder="مثلاً: یخچالم برفک می‌زنه و صدای عجیب میده..." rows={3} style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"#e2e8f0",fontSize:14,fontFamily:"Vazirmatn,sans-serif",padding:"14px 16px 6px",resize:"none",lineHeight:1.7}}/>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px 10px"}}>
                    <span style={{fontSize:10,color:"#1e3a4a"}}>Enter برای ارسال</span>
                    <button onClick={()=>diagnose()} style={{...S.btn(true),padding:"9px 20px"}}>تشخیص بده ←</button>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {SUGGESTIONS.map(s=>(
                    <button key={s} onClick={()=>{setQuery(s);setTimeout(()=>diagnose(s),50);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,.05)",color:"#334155",borderRadius:12,padding:"5px 11px",fontSize:11,fontFamily:"Vazirmatn,sans-serif",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(56,189,248,.25)";e.currentTarget.style.color="#38bdf8";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.05)";e.currentTarget.style.color="#334155";}}>{s}</button>
                  ))}
                </div>
              </>
            )}
            {diagPhase==="loading"&&(
              <div style={{textAlign:"center",padding:"70px 0",animation:"fadeIn .3s ease"}}>
                <div style={{position:"relative",width:100,height:100,margin:"0 auto 28px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{position:"absolute",top:0,left:8}}><Gear size={38} speed={5} color="#38bdf8" opacity={.6}/></div>
                  <div style={{position:"absolute",bottom:0,right:8}}><Gear size={27} speed={3.5} color="#818cf8" opacity={.5} reverse/></div>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"linear-gradient(135deg,#38bdf8,#818cf8)",boxShadow:"0 0 20px rgba(56,189,248,.7)",animation:"pulseGlow 1.5s ease-in-out infinite"}}/>
                </div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:"Orbitron,sans-serif",...S.gradText}}>در حال تشخیص{".".repeat(loadDots)}</div>
                <div style={{color:"#1e3a4a",fontSize:11,marginTop:6}}>هوش مصنوعی مشکل رو بررسی می‌کنه</div>
              </div>
            )}
            {diagPhase==="result"&&(
              <div style={{animation:"fadeUp .4s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <button onClick={()=>{setDiagPhase("idle");setDiagResult("");setQuery("");}} style={{...S.btn(false),padding:"7px 14px",fontSize:12}}>← سوال جدید</button>
                  <div style={{flex:1,height:1,background:"rgba(56,189,248,.08)"}}/>
                </div>
                <div style={{...S.card,marginBottom:12,padding:"14px 16px",fontSize:12,color:"#475569"}}>
                  <span style={{color:"#1e3a4a",fontSize:10,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:4}}>سوال</span>
                  {(selCat?`${selCat} · `:"")+query}
                </div>
                <div style={{...S.card,fontSize:13,lineHeight:2,color:"#cbd5e1",whiteSpace:"pre-wrap",minHeight:180,padding:"20px"}}>
                  {displayed}{!done&&<span style={{animation:"blink .7s step-end infinite",color:"#38bdf8"}}>▌</span>}
                </div>
                {done&&(
                  <div style={{marginTop:16,background:"linear-gradient(135deg,rgba(14,165,233,.05),rgba(99,102,241,.05))",border:"1px solid rgba(56,189,248,.1)",borderRadius:16,padding:"20px",textAlign:"center",animation:"fadeUp .4s ease"}}>
                    <div style={{fontSize:11,color:"#334155",marginBottom:12}}>نزدیک‌ترین تعمیرگاه رو هم پیدا کن؟</div>
                    <button onClick={()=>setTab("find")} style={{...S.btn(true),fontSize:12,padding:"9px 20px"}}>📍 یافتن تعمیرگاه</button>
                    <span style={{margin:"0 8px",color:"#1e3a4a",fontSize:11}}>یا</span>
                    <button onClick={()=>setShowTip(true)} style={{...S.btn(false),fontSize:12,padding:"9px 18px"}}>☕ حمایت</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FIND */}
        {tab==="find"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:900,fontFamily:"Orbitron,sans-serif",marginBottom:6,...S.gradText}}>یافتن تعمیرگاه</h2>
              <p style={{color:"#334155",fontSize:12}}>نزدیک‌ترین تعمیرگاه رو پیدا کن</p>
            </div>
            <div style={{...S.card,marginBottom:16,padding:"16px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <Select label="شهر" value={findCity} onChange={setFindCity} options={CITIES}/>
                <Select label="نوع خدمات" value={findCat} onChange={setFindCat} options={CATS}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={doFind} style={{...S.btn(true),flex:1,padding:"10px"}}>🔍 جستجو</button>
                <button onClick={getUserLocation} style={{...S.btn(false),padding:"10px 14px",fontSize:12}} disabled={locLoading}>{locLoading?"...":"📡 موقعیت من"}</button>
              </div>
              {userLat&&<div style={{fontSize:11,color:"#10b981",marginTop:8,textAlign:"center"}}>✓ موقعیت دریافت شد — نتایج بر اساس فاصله مرتب می‌شن</div>}
            </div>
            {findResults===null&&shops.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:"#1e3a4a",fontSize:13}}>
                <div style={{fontSize:40,marginBottom:12}}>🏪</div>
                هنوز تعمیرگاهی ثبت نشده.<br/>
                <button onClick={()=>setTab("register")} style={{...S.btn(true),marginTop:14,fontSize:12}}>اولین تعمیرگاه رو ثبت کن</button>
              </div>
            )}
            {findResults!==null&&findResults.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:"#1e3a4a",fontSize:13}}><div style={{fontSize:40,marginBottom:12}}>😕</div>تعمیرگاهی با این مشخصات پیدا نشد</div>
            )}
            {findResults!==null&&findResults.length>0&&(
              <>
                <div style={{height:220,borderRadius:14,overflow:"hidden",marginBottom:16,border:"1px solid rgba(56,189,248,.12)"}}>
                  <LeafletLoader><MapPicker lat={userLat||35.6892} lng={userLng||51.389} readonly markers={findResults.filter(s=>s.lat&&s.lng).map(s=>({lat:s.lat,lng:s.lng,name:s.name,city:s.city}))}/></LeafletLoader>
                </div>
                <div style={{fontSize:11,color:"#38bdf8",marginBottom:10,letterSpacing:1}}>{findResults.length} تعمیرگاه یافت شد</div>
                {findResults.map(s=>(
                  <div key={s.id} style={{...S.card,marginBottom:10,padding:"16px",transition:"all .25s"}} onMouseEnter={e=>{e.currentTarget.style.border="1px solid rgba(56,189,248,.25)";e.currentTarget.style.transform="translateY(-1px)";}} onMouseLeave={e=>{e.currentTarget.style.border="1px solid rgba(56,189,248,.1)";e.currentTarget.style.transform="none";}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                      <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,rgba(14,165,233,.2),rgba(99,102,241,.2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🔧</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{s.name}</span>
                          {s.distance!=null&&<span style={{fontSize:10,color:"#38bdf8",background:"rgba(56,189,248,.1)",borderRadius:8,padding:"3px 8px"}}>{s.distance<1?`${(s.distance*1000).toFixed(0)}m`:`${s.distance.toFixed(1)}km`}</span>}
                        </div>
                        <div style={{fontSize:11,color:"#334155",marginBottom:8}}>📍 {s.city}{s.address?` · ${s.address}`:""}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                          {s.services.map(sv=><span key={sv} style={{fontSize:10,color:"#475569",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"2px 7px"}}>{sv}</span>)}
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {s.phone&&<a href={`tel:${s.phone}`} style={{fontSize:11,color:"#38bdf8",background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.15)",borderRadius:8,padding:"5px 10px",textDecoration:"none"}}>📞 {s.phone}</a>}
                          {s.telegram&&<a href={`https://t.me/${s.telegram}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#818cf8",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.15)",borderRadius:8,padding:"5px 10px",textDecoration:"none"}}>✈️ @{s.telegram}</a>}
                          {s.instagram&&<a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#f472b6",background:"rgba(244,114,182,.08)",border:"1px solid rgba(244,114,182,.15)",borderRadius:8,padding:"5px 10px",textDecoration:"none"}}>📸 {s.instagram}</a>}
                        </div>
                        {s.desc&&<div style={{fontSize:11,color:"#334155",marginTop:8,lineHeight:1.7}}>{s.desc}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {findResults===null&&shops.length>0&&(
              <div style={{display:"grid",gap:10}}>
                {shops.map(s=>(
                  <div key={s.id} style={{...S.card,padding:"14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,rgba(14,165,233,.15),rgba(99,102,241,.15))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🔧</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{s.name}</div>
                        <div style={{fontSize:11,color:"#334155"}}>📍 {s.city} · {s.phone}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REGISTER */}
        {tab==="register"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:900,fontFamily:"Orbitron,sans-serif",marginBottom:6,...S.gradText}}>ثبت تعمیرگاه</h2>
              <p style={{color:"#334155",fontSize:12}}>اطلاعات تعمیرگاهت رو وارد کن — رایگان</p>
            </div>
            {regStep===3?(
              <div style={{textAlign:"center",padding:"50px 20px",animation:"fadeUp .5s ease"}}>
                <div style={{fontSize:56,marginBottom:16,animation:"float 3s ease-in-out infinite"}}>🎉</div>
                <div style={{fontSize:20,fontWeight:900,fontFamily:"Orbitron,sans-serif",marginBottom:8,...S.gradText}}>ثبت شد!</div>
                <div style={{color:"#334155",fontSize:13,marginBottom:24,lineHeight:1.9}}>تعمیرگاه <strong style={{color:"#e2e8f0"}}>{form.name}</strong> در taamiryar.com ثبت شد.<br/>کاربران می‌تونن شما رو پیدا کنن.</div>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <button onClick={()=>{setRegStep(0);setForm({name:"",owner:"",phone:"",telegram:"",instagram:"",city:"",address:"",services:[],lat:null,lng:null,desc:""});}} style={{...S.btn(false),fontSize:12}}>ثبت دیگری</button>
                  <button onClick={()=>setTab("find")} style={{...S.btn(true),fontSize:12}}>مشاهده در نقشه</button>
                </div>
              </div>
            ):(
              <>
                <div style={{display:"flex",gap:6,marginBottom:24}}>
                  {["اطلاعات","خدمات","موقعیت"].map((l,i)=>(
                    <div key={i} style={{flex:1}}>
                      <div style={{height:3,borderRadius:2,background:i<=regStep?"linear-gradient(90deg,#0ea5e9,#6366f1)":"rgba(56,189,248,.1)",transition:"all .4s"}}/>
                      <div style={{fontSize:10,color:i===regStep?"#38bdf8":i<regStep?"#475569":"#1e3a4a",marginTop:5,textAlign:"center"}}>{l}</div>
                    </div>
                  ))}
                </div>
                {regStep===0&&(
                  <div style={S.card}>
                    <Field label="نام تعمیرگاه *" value={form.name} onChange={formSet("name")} placeholder="تعمیرگاه رضایی"/>
                    <Field label="نام صاحب" value={form.owner} onChange={formSet("owner")} placeholder="علی رضایی"/>
                    <Field label="شماره تماس *" value={form.phone} onChange={formSet("phone")} placeholder="09121234567" type="tel"/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <Field label="تلگرام (بدون @)" value={form.telegram} onChange={formSet("telegram")} placeholder="username"/>
                      <Field label="اینستاگرام (بدون @)" value={form.instagram} onChange={formSet("instagram")} placeholder="username"/>
                    </div>
                    <Select label="شهر *" value={form.city} onChange={formSet("city")} options={CITIES}/>
                    <Field label="آدرس" value={form.address} onChange={formSet("address")} placeholder="خیابان، کوچه، پلاک..." multiline/>
                    <button onClick={()=>{if(form.name&&form.phone&&form.city)setRegStep(1);}} style={{...S.btn(!!(form.name&&form.phone&&form.city)),width:"100%",marginTop:4}}>مرحله بعد ←</button>
                  </div>
                )}
                {regStep===1&&(
                  <div style={S.card}>
                    <div style={{fontSize:11,color:"#475569",letterSpacing:1.2,textTransform:"uppercase",marginBottom:14}}>خدمات ارائه شده *</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                      {CATS.map(c=>(
                        <button key={c} onClick={()=>toggleService(c)} style={{background:form.services.includes(c)?"rgba(56,189,248,.15)":"rgba(255,255,255,.02)",border:`1px solid ${form.services.includes(c)?"rgba(56,189,248,.4)":"rgba(255,255,255,.08)"}`,color:form.services.includes(c)?"#38bdf8":"#475569",borderRadius:20,padding:"7px 14px",fontSize:12,fontFamily:"Vazirmatn,sans-serif",cursor:"pointer",transition:"all .2s"}}>{c}</button>
                      ))}
                    </div>
                    <Field label="توضیحات بیشتر" value={form.desc} onChange={formSet("desc")} placeholder="مثلاً: ۱۵ سال سابقه، گارانتی تعمیر..." multiline/>
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      <button onClick={()=>setRegStep(0)} style={{...S.btn(false),flex:"0 0 auto"}}>→ قبلی</button>
                      <button onClick={()=>{if(form.services.length>0)setRegStep(2);}} style={{...S.btn(form.services.length>0),flex:1}}>مرحله بعد ←</button>
                    </div>
                  </div>
                )}
                {regStep===2&&(
                  <div style={S.card}>
                    <div style={{fontSize:11,color:"#475569",letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>موقعیت روی نقشه (اختیاری)</div>
                    <div style={{fontSize:11,color:"#334155",marginBottom:12,lineHeight:1.7}}>روی نقشه کلیک کن تا موقعیت دقیق مشخص بشه</div>
                    <div style={{height:260,borderRadius:12,overflow:"hidden",marginBottom:14,border:"1px solid rgba(56,189,248,.12)"}}>
                      <LeafletLoader><MapPicker lat={form.lat||35.6892} lng={form.lng||51.389} onPick={(la,ln)=>setForm(p=>({...p,lat:la,lng:ln}))}/></LeafletLoader>
                    </div>
                    {form.lat&&<div style={{fontSize:11,color:"#10b981",marginBottom:12,textAlign:"center"}}>✓ موقعیت انتخاب شد</div>}
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setRegStep(1)} style={{...S.btn(false),flex:"0 0 auto"}}>→ قبلی</button>
                      <button onClick={submitShop} disabled={saving} style={{...S.btn(true),flex:1}}>{saving?"در حال ثبت...":"✓ ثبت تعمیرگاه"}</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* TIP MODAL */}
      {showTip&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20,animation:"fadeIn .2s ease"}} onClick={()=>setShowTip(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#070d1a",border:"1px solid rgba(56,189,248,.15)",borderRadius:24,padding:"32px 26px",width:"100%",maxWidth:360,textAlign:"center",boxShadow:"0 40px 80px #000",animation:"fadeUp .3s ease",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:240,height:120,background:"radial-gradient(ellipse,rgba(56,189,248,.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
            <div style={{fontSize:38,marginBottom:12}}>☕</div>
            <div style={{fontSize:18,fontWeight:900,fontFamily:"Orbitron,sans-serif",marginBottom:8,...S.gradText}}>یه قهوه بریز!</div>
            <div style={{color:"#334155",fontSize:12,marginBottom:22,lineHeight:1.8}}>taamiryar.com رایگانه — با حمایتت بهترش کن 🙏</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
              {[{a:"$1",e:"☕",l:"قهوه"},{a:"$3",e:"🍕",l:"پیتزا"},{a:"$5",e:"🚀",l:"ویژه"},{a:"$10",e:"💎",l:"قهرمان"}].map(({a,e,l})=>(
                <button key={a} onClick={()=>setTipAmt(a)} style={{background:tipAmt===a?"linear-gradient(135deg,rgba(14,165,233,.2),rgba(99,102,241,.2))":"rgba(255,255,255,.02)",border:`1px solid ${tipAmt===a?"rgba(56,189,248,.4)":"rgba(255,255,255,.05)"}`,color:tipAmt===a?"#38bdf8":"#475569",borderRadius:12,padding:"12px 8px",fontFamily:"Vazirmatn,sans-serif",cursor:"pointer",transition:"all .2s"}}>
                  <div style={{fontSize:20,marginBottom:3}}>{e}</div>
                  <div style={{fontSize:13,fontWeight:800}}>{a}</div>
                  <div style={{fontSize:9,opacity:.6,marginTop:1}}>{l}</div>
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{if(tipAmt){setTipDone(true);setShowTip(false);}}} style={{flex:1,background:tipAmt?"linear-gradient(135deg,#0ea5e9,#6366f1)":"rgba(255,255,255,.03)",border:"none",borderRadius:12,padding:"13px",color:tipAmt?"#fff":"#1e3a4a",fontFamily:"Vazirmatn,sans-serif",fontWeight:700,fontSize:13,cursor:tipAmt?"pointer":"default",transition:"all .2s",boxShadow:tipAmt?"0 4px 20px rgba(14,165,233,.4)":"none"}}>
                {tipAmt?`💛 ${tipAmt} حمایت`:"مبلغ رو انتخاب کن"}
              </button>
              <button onClick={()=>setShowTip(false)} style={{background:"transparent",border:"1px solid rgba(255,255,255,.05)",color:"#1e3a4a",borderRadius:12,padding:"13px 14px",fontFamily:"Vazirmatn,sans-serif",fontSize:12,cursor:"pointer"}}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
