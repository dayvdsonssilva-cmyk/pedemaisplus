import { useState, useEffect, useRef, useCallback } from "react";

const ANIM = `
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes floatYR{0%,100%{transform:translateY(0) rotate(8deg)}50%{transform:translateY(-18px) rotate(-8deg)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes popIn{0%{transform:scale(.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes glow{0%,100%{box-shadow:0 0 10px 2px rgba(124,58,237,.4)}50%{box-shadow:0 0 26px 6px rgba(236,72,153,.55)}}
@keyframes waveBar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1.2)}}
@keyframes borderPulse{0%,100%{border-color:rgba(124,58,237,.5)}50%{border-color:rgba(236,72,153,.7)}}
`;

const THEMES = {
  infantil: [
    { id:"princesa",   name:"Princesa",    emoji:"👑", bg:"#1A0A14", accent:"#FF69B4", light:"#FFD6EC", frame:"#FFD700", particles:["👑","🌸","💎","🦋","✨","🌺"] },
    { id:"superhero",  name:"Super-Herói", emoji:"⚡", bg:"#080822", accent:"#818CF8", light:"#C7D2FE", frame:"#FACC15", particles:["⚡","🦸","💥","🌟","🔥","🛡️"] },
    { id:"dino",       name:"Dinossauros", emoji:"🦕", bg:"#040F04", accent:"#4ADE80", light:"#BBF7D0", frame:"#86EFAC", particles:["🦕","🌿","🥚","🦖","🍃","🌴"] },
    { id:"unicornio",  name:"Unicórnio",   emoji:"🦄", bg:"#100820", accent:"#E879F9", light:"#F5D0FE", frame:"#E879F9", particles:["🦄","🌈","⭐","🎀","💫","🌙"] },
    { id:"fazendinha", name:"Fazendinha",  emoji:"🐄", bg:"#140C00", accent:"#FBBF24", light:"#FDE68A", frame:"#FCD34D", particles:["🐄","🌻","🐓","🌾","🐑","🌼"] },
    { id:"circo",      name:"Circo",       emoji:"🎪", bg:"#140000", accent:"#F87171", light:"#FCA5A5", frame:"#FB923C", particles:["🎪","🎠","🃏","🎭","🎡","🎈"] },
  ],
  adolescente: [
    { id:"neon",     name:"Neon Party",  emoji:"🌈", bg:"#04040F", accent:"#39FF14", light:"#BBFF99", frame:"#FF1493", particles:["✦","◈","◆","✧","◇","✦"] },
    { id:"tropical", name:"Tropical",    emoji:"🌴", bg:"#081408", accent:"#FB923C", light:"#FED7AA", frame:"#FCD34D", particles:["🌴","🌺","🌊","🍹","🦜","🌸"] },
    { id:"retro",    name:"Anos 80/90",  emoji:"📼", bg:"#0A0018", accent:"#F472B6", light:"#FBCFE8", frame:"#A855F7", particles:["📼","🕹️","📺","💾","🎸","🎶"] },
    { id:"gamer",    name:"Gamer",       emoji:"🎮", bg:"#001408", accent:"#00FF88", light:"#A7F3D0", frame:"#22D3EE", particles:["🎮","⚔️","🏆","💻","🕹️","👾"] },
    { id:"esportes", name:"Esportes",    emoji:"⚽", bg:"#001A05", accent:"#4ADE80", light:"#BBF7D0", frame:"#86EFAC", particles:["⚽","🏅","🏆","🎯","🔥","🥇"] },
    { id:"kpop",     name:"K-Pop",       emoji:"🎤", bg:"#180010", accent:"#F472B6", light:"#FBCFE8", frame:"#F0ABFC", particles:["🎤","💿","🌸","⭐","🎵","💜"] },
  ]
};

function Confetti({ active }) {
  const cvs = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const colors = ["#7C3AED","#EC4899","#F59E0B","#22C55E","#6366F1","#EF4444","#0EA5E9","#F472B6"];
    const pieces = Array.from({length:130}, () => ({
      x: Math.random()*c.width, y: -20,
      r: Math.random()*7+3,
      color: colors[Math.floor(Math.random()*colors.length)],
      vx: (Math.random()-.5)*5, vy: Math.random()*4+2,
      rot: Math.random()*360, vr: (Math.random()-.5)*9,
      shape: Math.random()>.5?"rect":"circle"
    }));
    let f=0;
    function draw() {
      ctx.clearRect(0,0,c.width,c.height);
      pieces.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
        if(p.y>c.height){ p.y=-20; p.x=Math.random()*c.width; }
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,1-p.y/c.height+.25);
        if(p.shape==="rect") ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);
        else { ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      });
      f++;
      if(f<320) raf.current=requestAnimationFrame(draw);
    }
    raf.current=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(raf.current);
  },[active]);
  return <canvas ref={cvs} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:999}} />;
}

function FloatingParticles({ particles }) {
  const grid = [];
  particles.forEach((p,i) => [0,1,2].forEach(j => {
    grid.push({ p, top:`${(i*37+j*61)%82+4}%`, left:`${(i*53+j*29)%86+4}%`, size:14+j*7, op:0.1+j*0.04, anim:3+i*.7+j*.5, delay:i*.4+j*.9 });
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
      {grid.map((g,k)=>(
        <div key={k} style={{ position:"absolute", left:g.left, top:g.top, fontSize:g.size, opacity:g.op, animation:`floatY ${g.anim}s ease-in-out infinite`, animationDelay:`${g.delay}s` }}>{g.p}</div>
      ))}
    </div>
  );
}

function StepBar({ current }) {
  const steps = ["Categoria","Tema","Foto + IA","Dados","Prévia"];
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:"1.5rem"}}>
      {steps.map((s,i) => (
        <div key={s} style={{display:"flex",alignItems:"center"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{
              width:32,height:32,borderRadius:"50%",
              background:i<current?"#7C3AED":i===current?"linear-gradient(135deg,#7C3AED,#EC4899)":"#111",
              color:i<=current?"#fff":"#444",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:13,fontWeight:800,
              boxShadow:i===current?"0 0 0 4px rgba(124,58,237,.25), 0 0 16px rgba(124,58,237,.4)":"none",
              animation:i===current?"glow 2.5s ease-in-out infinite":"none",
              transition:"all .3s"
            }}>{i<current?"✓":i+1}</div>
            <span style={{fontSize:10,color:i===current?"#EC4899":"#444",fontWeight:i===current?800:400,whiteSpace:"nowrap"}}>{s}</span>
          </div>
          {i<steps.length-1 && <div style={{width:32,height:2,background:i<current?"#7C3AED":"#111",margin:"0 2px",marginBottom:18,transition:"background .4s"}} />}
        </div>
      ))}
    </div>
  );
}

function PhotoStep({ photo, setPhoto, theme, aiResult, setAiResult, analyzing, setAnalyzing, onBack, onNext }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const analyze = useCallback(async (base64, mediaType) => {
    setAnalyzing(true); setAiResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:mediaType,data:base64}},
            {type:"text",text:`Você é um criador de convites de festa infantil. Analise esta foto e o tema "${theme.name}".
Responda SOMENTE com JSON válido sem markdown:
{"personagem":"como esta criança seria descrita no tema (1 frase curta, ex: A pequena princesa encantada)","mensagem":"mensagem animada para o convite máx 18 palavras em português","emoji_especial":"2 emojis que combinam com a criança e o tema"}`}
          ]}]
        })
      });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"{}";
      setAiResult(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    } catch {
      setAiResult({personagem:"Estrela da festa!",mensagem:"Venha celebrar comigo neste dia incrível e especial!",emoji_especial:"🎉✨"});
    }
    setAnalyzing(false);
  },[theme]);

  const handleFile = (file) => {
    if(!file||!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      setPhoto(dataUrl);
      analyze(dataUrl.split(",")[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{animation:"fadeUp .4s ease"}}>
      <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
        <div style={{fontSize:44,animation:"floatY 3s ease-in-out infinite"}}>{theme.emoji}</div>
        <h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:"8px 0 4px"}}>Foto do Aniversariante</h2>
        <p style={{color:"#666",margin:0,fontSize:14}}>Nossa IA vai transformar a foto no tema escolhido 🪄</p>
      </div>

      <div
        onClick={()=>!photo&&fileRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}
        style={{
          border:`2px dashed ${dragging?theme.accent:photo?theme.accent:"#222"}`,
          borderRadius:20, padding:photo?"1.25rem":"2.5rem 1rem",
          textAlign:"center", cursor:photo?"default":"pointer",
          background:dragging?theme.accent+"12":photo?theme.accent+"08":"#0A0A14",
          transition:"all .3s", marginBottom:14,
          animation:dragging?"borderPulse .6s ease-in-out infinite":"none"
        }}
      >
        {photo ? (
          <div style={{position:"relative",display:"inline-block"}}>
            <img src={photo} alt="Foto" style={{
              width:140,height:140,objectFit:"cover",borderRadius:"50%",
              border:`4px solid ${theme.accent}`,
              boxShadow:`0 0 0 6px ${theme.accent}25, 0 0 40px ${theme.accent}55`,
              animation:"popIn .5s ease"
            }} />
            <button
              onClick={e=>{e.stopPropagation();setPhoto(null);setAiResult(null);if(fileRef.current)fileRef.current.value="";}}
              style={{position:"absolute",top:4,right:4,background:"#EF4444",border:"none",borderRadius:"50%",width:26,height:26,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}
            >✕</button>
            {analyzing && (
              <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:26,animation:"spin 1s linear infinite"}}>✨</div>
              </div>
            )}
            {!analyzing&&aiResult&&(
              <div style={{position:"absolute",bottom:4,right:4,background:theme.bg,borderRadius:"50%",padding:4,border:`2px solid ${theme.accent}`,fontSize:18,lineHeight:1}}>
                {(aiResult.emoji_especial||"🎉")[0]}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{fontSize:52,marginBottom:12,animation:"floatY 2.5s ease-in-out infinite"}}>📸</div>
            <div style={{color:"#bbb",fontSize:15,fontWeight:700,marginBottom:4}}>Clique ou arraste a foto aqui</div>
            <div style={{color:"#444",fontSize:13}}>JPG ou PNG • Foto do rosto funciona melhor</div>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
      </div>

      {analyzing && (
        <div style={{background:"#0A0A14",border:`1px solid ${theme.accent}30`,borderRadius:16,padding:"1rem 1.25rem",marginBottom:14,animation:"fadeIn .4s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:30,animation:"spin 1.5s linear infinite"}}>🤖</div>
            <div>
              <div style={{color:theme.accent,fontWeight:800,fontSize:14}}>IA analisando a foto...</div>
              <div style={{display:"flex",gap:5,marginTop:8}}>
                {[.1,.2,.3,.4,.5,.6].map(d=>(
                  <div key={d} style={{width:5,height:22,background:theme.accent,borderRadius:3,opacity:.5,animation:`waveBar .8s ease-in-out infinite`,animationDelay:`${d}s`}} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {aiResult&&!analyzing&&(
        <div style={{background:`linear-gradient(135deg,${theme.accent}18,${theme.accent}05)`,border:`1px solid ${theme.accent}40`,borderRadius:16,padding:"1rem 1.25rem",marginBottom:14,animation:"popIn .6s ease"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{fontSize:30}}>{aiResult.emoji_especial||"🎉"}</div>
            <div>
              <div style={{color:theme.accent,fontWeight:800,fontSize:12,marginBottom:4,letterSpacing:.5}}>✦ IA IDENTIFICOU</div>
              <div style={{color:"#fff",fontWeight:700,fontSize:15,marginBottom:5}}>{aiResult.personagem}</div>
              <div style={{color:"#aaa",fontSize:13,fontStyle:"italic"}}>"{aiResult.mensagem}"</div>
            </div>
          </div>
        </div>
      )}

      <div style={{textAlign:"center",marginBottom:10}}>
        <button onClick={onNext} style={{background:"none",border:"none",color:"#444",fontSize:13,cursor:"pointer",textDecoration:"underline"}}>
          Pular esta etapa →
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12}}>
        <button onClick={onBack} style={{padding:"13px",background:"#111",border:"1px solid #222",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",color:"#aaa"}}>← Voltar</button>
        <button onClick={onNext} disabled={analyzing} style={{
          padding:"13px",
          background:analyzing?"#111":`linear-gradient(135deg,${theme.accent},${theme.frame})`,
          color:analyzing?"#444":"#000",
          border:"none",borderRadius:14,fontSize:15,fontWeight:900,
          cursor:analyzing?"not-allowed":"pointer",
          boxShadow:analyzing?"none":`0 4px 20px ${theme.accent}55`,
          animation:!analyzing&&photo&&aiResult?"pulse 2s ease-in-out infinite":"none",
          transition:"all .3s"
        }}>{analyzing?"IA processando...":"Personalizar Convite →"}</button>
      </div>
    </div>
  );
}

function DataStep({ formData, setFormData, theme, onBack, onNext }) {
  const inp = (label, key, type="text", placeholder="", span=false) => (
    <div style={{gridColumn:span?"1/-1":"auto"}}>
      <label style={{display:"block",fontSize:11,fontWeight:700,color:"#555",marginBottom:6,letterSpacing:.8}}>{label}</label>
      <input type={type} value={formData[key]||""} placeholder={placeholder}
        onChange={e=>setFormData(p=>({...p,[key]:e.target.value}))}
        style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${formData[key]?theme.accent+"50":"#1A1A2E"}`,borderRadius:12,fontSize:14,outline:"none",boxSizing:"border-box",background:"#0A0A14",color:"#fff",fontFamily:"inherit",transition:"border .2s"}}
        onFocus={e=>{e.target.style.border=`1.5px solid ${theme.accent}`;e.target.style.boxShadow=`0 0 0 3px ${theme.accent}20`;}}
        onBlur={e=>{e.target.style.border=`1.5px solid ${formData[key]?theme.accent+"50":"#1A1A2E"}`;e.target.style.boxShadow="none";}}
      />
    </div>
  );
  const ok = formData.nome&&formData.idade&&formData.data&&formData.hora&&formData.local;
  return (
    <div style={{animation:"fadeUp .4s ease"}}>
      <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
        <div style={{fontSize:40,animation:"floatY 3s ease-in-out infinite"}}>{theme.emoji}</div>
        <h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:"8px 0 4px"}}>Dados da Festa</h2>
        <p style={{color:"#666",margin:0,fontSize:14}}>Preencha para montar o convite perfeito</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {inp("NOME DO ANIVERSARIANTE *","nome","text","Ex: Ana Clara",true)}
        {inp("IDADE *","idade","number","Ex: 7")}
        {inp("DATA DA FESTA *","data","date")}
        {inp("HORÁRIO *","hora","time")}
        {inp("LOCAL *","local","text","Ex: Salão das Flores, Rua...",true)}
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:"#555",marginBottom:6,letterSpacing:.8}}>MENSAGEM ESPECIAL</label>
        <textarea value={formData.mensagem||""} placeholder="Ex: Venha celebrar comigo! 🎉" onChange={e=>setFormData(p=>({...p,mensagem:e.target.value}))} rows={2}
          style={{width:"100%",padding:"12px 14px",border:"1.5px solid #1A1A2E",borderRadius:12,fontSize:14,outline:"none",boxSizing:"border-box",resize:"none",background:"#0A0A14",color:"#fff",fontFamily:"inherit"}}
        />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12}}>
        <button onClick={onBack} style={{padding:"13px",background:"#111",border:"1px solid #222",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",color:"#aaa"}}>← Voltar</button>
        <button onClick={onNext} disabled={!ok} style={{
          padding:"13px",
          background:ok?"linear-gradient(135deg,#7C3AED,#EC4899)":"#111",
          color:ok?"#fff":"#444",border:"none",borderRadius:14,fontSize:15,fontWeight:900,
          cursor:ok?"pointer":"not-allowed",
          boxShadow:ok?"0 4px 20px rgba(124,58,237,.5)":"none",
          animation:ok?"glow 2s ease-in-out infinite":"none",transition:"all .3s"
        }}>Gerar Convite 🪄</button>
      </div>
    </div>
  );
}

function InviteCard({ data, theme, photo, aiResult, watermarked }) {
  return (
    <div style={{position:"relative",borderRadius:24,overflow:"hidden",maxWidth:320,margin:"0 auto",boxShadow:`0 20px 60px ${theme.accent}40, 0 0 0 1px ${theme.accent}25`}}>
      <div style={{background:theme.bg,padding:"2rem 1.5rem",minHeight:520,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:160,height:160,borderRadius:"50%",background:theme.accent+"15",animation:"floatY 6s ease-in-out infinite"}} />
        <div style={{position:"absolute",bottom:-30,left:-30,width:110,height:110,borderRadius:"50%",background:theme.frame+"18",animation:"floatY 8s ease-in-out infinite",animationDelay:"2s"}} />
        {theme.particles.slice(0,4).map((p,i)=>(
          <div key={i} style={{position:"absolute",fontSize:16,opacity:.2,top:`${18+i*16}%`,left:i%2===0?`${4+i*2}%`:`${86-i*3}%`,animation:`floatY ${3.5+i*.7}s ease-in-out infinite`,animationDelay:`${i*.6}s`}}>{p}</div>
        ))}
        <div style={{fontSize:10,letterSpacing:3,color:theme.accent,fontWeight:800,textTransform:"uppercase",marginBottom:14,opacity:.9}}>🎉 Você está convidado!</div>
        <div style={{position:"relative",marginBottom:14}}>
          {photo ? (
            <div style={{position:"relative"}}>
              <img src={photo} alt="" style={{width:120,height:120,objectFit:"cover",borderRadius:"50%",border:`4px solid ${theme.accent}`,boxShadow:`0 0 0 6px ${theme.accent}20, 0 0 30px ${theme.accent}55`}} />
              {aiResult?.emoji_especial && (
                <div style={{position:"absolute",bottom:2,right:2,background:theme.bg,borderRadius:"50%",padding:4,border:`2px solid ${theme.accent}`,fontSize:16,lineHeight:1}}>{(aiResult.emoji_especial||"🎉")[0]}</div>
              )}
            </div>
          ) : (
            <div style={{width:100,height:100,borderRadius:"50%",background:`radial-gradient(circle,${theme.accent}40,${theme.accent}10)`,border:`3px solid ${theme.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:50,boxShadow:`0 0 30px ${theme.accent}50`}}>{theme.emoji}</div>
          )}
        </div>
        <div style={{fontSize:12,color:theme.light,opacity:.6,marginBottom:2}}>Festa de</div>
        <div style={{fontSize:30,fontWeight:900,color:"#fff",lineHeight:1.1,textAlign:"center",textShadow:`0 0 20px ${theme.accent}70`,marginBottom:8}}>{data.nome||"Ana Clara"}</div>
        <div style={{margin:"4px 0 10px",background:`linear-gradient(135deg,${theme.accent},${theme.frame})`,borderRadius:99,padding:"5px 18px",display:"flex",alignItems:"baseline",gap:5,boxShadow:`0 4px 16px ${theme.accent}55`}}>
          <span style={{fontSize:34,fontWeight:900,color:"#000",lineHeight:1}}>{data.idade||"7"}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#000",opacity:.8}}>anos</span>
        </div>
        {aiResult?.personagem && <div style={{fontSize:12,color:theme.accent,fontStyle:"italic",textAlign:"center",maxWidth:220,marginBottom:8,opacity:.9}}>{aiResult.personagem}</div>}
        <div style={{background:"rgba(255,255,255,.05)",border:`1px solid ${theme.accent}25`,borderRadius:12,padding:"10px 16px",width:"100%",marginBottom:10,boxSizing:"border-box"}}>
          <div style={{fontSize:12,color:"#ccc",marginBottom:4,display:"flex",alignItems:"center",gap:7}}>
            <span>📅</span>
            <span>{data.data ? new Date(data.data+"T12:00").toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"}) : "15 de Junho, 2025"}</span>
          </div>
          <div style={{fontSize:12,color:"#ccc",marginBottom:4,display:"flex",alignItems:"center",gap:7}}><span>🕐</span><span>{data.hora||"16:00"}h</span></div>
          <div style={{fontSize:11,color:"#aaa",display:"flex",alignItems:"flex-start",gap:7}}><span>📍</span><span style={{lineHeight:1.4}}>{data.local||"Av. das Flores, 123"}</span></div>
        </div>
        <div style={{fontSize:12,color:theme.light,textAlign:"center",fontStyle:"italic",opacity:.75,maxWidth:220,lineHeight:1.5}}>
          "{aiResult?.mensagem||data.mensagem||"Venha celebrar comigo!"}"
        </div>
        <div style={{marginTop:12,background:`${theme.accent}20`,border:`1px solid ${theme.accent}40`,borderRadius:99,padding:"4px 16px",fontSize:11,color:theme.accent,fontWeight:800}}>{theme.emoji} {theme.name}</div>
        <div style={{marginTop:10,fontSize:9,color:"#222",letterSpacing:1}}>feito com ConvitAI.com.br</div>
      </div>
      {watermarked && (
        <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          {[0,1,2,3,4,5,6,7,8].map(i=>(
            <div key={i} style={{position:"absolute",top:`${8+i*11}%`,left:`${(i*22)%58+5}%`,fontSize:10,fontWeight:900,color:"rgba(255,255,255,.15)",transform:"rotate(-35deg)",whiteSpace:"nowrap",letterSpacing:2}}>© CONVITAI.COM.BR</div>
          ))}
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.32)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"rgba(0,0,0,.85)",borderRadius:16,padding:"14px 26px",textAlign:"center",border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontSize:26,marginBottom:5}}>🔒</div>
              <div style={{color:"#fff",fontSize:14,fontWeight:800}}>Pague para baixar</div>
              <div style={{color:"#888",fontSize:12,marginTop:2}}>sem marca d'água</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewStep({ data, theme, photo, aiResult, onBack, onRestart, triggerConfetti }) {
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const msgs = [`Aplicando tema ${theme.name}...`, photo?"Integrando sua foto...":"Compondo elementos visuais...", aiResult?"Personalizando com IA...":"Adicionando detalhes...", "Finalizando convite premium..."];
  useEffect(() => {
    let i=0; const iv=setInterval(()=>{ i++; if(i<msgs.length) setMsgIdx(i); else { clearInterval(iv); setLoading(false); } },880);
    return()=>clearInterval(iv);
  },[]);
  const handlePay = () => { setPaying(true); setTimeout(()=>{ setPaying(false); setPaid(true); triggerConfetti(); },2300); };

  if (loading) return (
    <div style={{textAlign:"center",padding:"3rem 1rem",animation:"fadeIn .5s ease"}}>
      <div style={{position:"relative",width:80,height:80,margin:"0 auto 24px"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`3px solid ${theme.accent}25`,animation:"spin 4s linear infinite"}} />
        <div style={{position:"absolute",inset:4,borderRadius:"50%",border:`3px solid ${theme.accent}`,borderTopColor:"transparent",animation:"spin 1s linear infinite"}} />
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,animation:"floatY 2s ease-in-out infinite"}}>{theme.emoji}</div>
      </div>
      <div style={{fontSize:18,fontWeight:900,color:theme.accent,marginBottom:8}}>Criando seu convite...</div>
      <div style={{fontSize:13,color:"#666",marginBottom:24,height:20,transition:"all .3s"}}>{msgs[msgIdx]}</div>
      <div style={{background:"#0A0A14",borderRadius:99,height:6,overflow:"hidden",maxWidth:280,margin:"0 auto"}}>
        <div style={{background:`linear-gradient(90deg,${theme.accent},${theme.frame})`,height:"100%",borderRadius:99,backgroundSize:"200% auto",animation:"shimmer 1.5s linear infinite",width:"90%",transition:"width 3.5s ease"}} />
      </div>
    </div>
  );

  return (
    <div style={{animation:"fadeUp .5s ease"}}>
      <div style={{textAlign:"center",marginBottom:"1.25rem"}}>
        <h2 style={{fontSize:20,fontWeight:900,color:"#fff",margin:"0 0 4px"}}>{paid?"🎉 Download liberado!":"Seu Convite"}</h2>
        <p style={{color:"#666",margin:0,fontSize:13}}>{paid?"Imagem sem marca d'água pronta!":"Pague para baixar em alta resolução"}</p>
      </div>
      <InviteCard data={data} theme={theme} photo={photo} aiResult={aiResult} watermarked={!paid} />
      <div style={{marginTop:20}}>
        {!paid ? (
          <div>
            <div style={{background:`linear-gradient(135deg,${theme.accent}12,#0A0A14)`,border:`1px solid ${theme.accent}35`,borderRadius:16,padding:"1rem 1.25rem",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:30}}>✨</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,color:theme.accent,fontSize:14}}>Desbloqueie o convite premium</div>
                <div style={{color:"#555",fontSize:12,marginTop:2}}>PNG 4K • Versão print • Envio WhatsApp</div>
              </div>
              <div style={{fontWeight:900,fontSize:22,color:"#fff"}}>R$14<span style={{fontSize:13}}>,90</span></div>
            </div>
            <button onClick={handlePay} disabled={paying} style={{
              width:"100%",padding:"16px",
              background:paying?"#111":"linear-gradient(135deg,#7C3AED,#EC4899)",
              color:paying?"#444":"#fff",border:"none",borderRadius:14,fontSize:16,fontWeight:900,
              cursor:paying?"wait":"pointer",
              boxShadow:paying?"none":"0 6px 24px rgba(124,58,237,.5)",
              animation:paying?"none":"glow 2.5s ease-in-out infinite",
              marginBottom:10,transition:"all .3s"
            }}>
              {paying?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span>Processando...</span>:"💳 Pagar com Mercado Pago — R$ 14,90"}
            </button>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={onBack} style={{padding:"12px",background:"#111",border:"1px solid #1A1A2E",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",color:"#aaa"}}>← Editar</button>
              <button style={{padding:"12px",background:"#111",border:"1px solid #1A1A2E",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",color:"#aaa"}}>📤 Compartilhar prévia</button>
            </div>
          </div>
        ) : (
          <div style={{animation:"popIn .5s ease"}}>
            <div style={{background:"#041408",border:"1px solid #22C55E40",borderRadius:14,padding:"1rem",marginBottom:14,textAlign:"center"}}>
              <div style={{fontWeight:800,color:"#22C55E",marginBottom:2}}>✅ Pagamento confirmado!</div>
              <div style={{color:"#16A34A",fontSize:13}}>Convite premium sem marca d'água liberado</div>
            </div>
            <button style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#16A34A,#4ADE80)",color:"#fff",border:"none",borderRadius:14,fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:"0 6px 20px rgba(74,222,128,.4)",marginBottom:10,animation:"pulse 2s ease-in-out infinite"}}>⬇️ Baixar PNG sem marca d'água</button>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <button style={{padding:"12px",background:"#041408",border:"1px solid #22C55E30",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",color:"#22C55E"}}>🖨️ Versão Print</button>
              <button style={{padding:"12px",background:"#041408",border:"1px solid #25D36630",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",color:"#25D366"}}>📱 WhatsApp</button>
            </div>
            <button onClick={onRestart} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #1A1A2E",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",color:"#444"}}>+ Criar novo convite</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConvitAI() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [theme, setTheme] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState({});
  const [confetti, setConfetti] = useState(false);
  const t = theme || THEMES.infantil[0];
  const restart = () => { setStep(0);setCategory("");setTheme(null);setPhoto(null);setAiResult(null);setAnalyzing(false);setFormData({});setConfetti(false); };

  return (
    <>
      <style>{ANIM}</style>
      <Confetti active={confetti} />
      {step>=3&&theme&&<FloatingParticles particles={theme.particles} />}
      <div style={{minHeight:"100vh",background:"#06060F",fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{background:"rgba(6,6,15,.97)",backdropFilter:"blur(14px)",borderBottom:"1px solid #111",padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#7C3AED,#EC4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 20px rgba(124,58,237,.45)",animation:"glow 3s ease-in-out infinite"}}>🎉</div>
            <div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:-.5,background:"linear-gradient(135deg,#7C3AED,#EC4899,#F59E0B)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"200%",animation:"shimmer 4s linear infinite"}}>ConvitAI</div>
              <div style={{fontSize:9,color:"#333",marginTop:-2,letterSpacing:2}}>CONVITES COM INTELIGÊNCIA</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{padding:"7px 14px",border:"1px solid #1A1A2E",borderRadius:8,background:"transparent",fontSize:13,fontWeight:700,cursor:"pointer",color:"#666"}}>Entrar</button>
            <button style={{padding:"7px 14px",border:"none",borderRadius:8,background:"linear-gradient(135deg,#7C3AED,#EC4899)",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff",boxShadow:"0 0 14px rgba(124,58,237,.4)"}}>Criar grátis</button>
          </div>
        </div>

        {/* Hero */}
        {step===0 && (
          <div style={{textAlign:"center",padding:"3rem 24px 2rem",maxWidth:680,margin:"0 auto",animation:"fadeUp .6s ease"}}>
            <div style={{position:"relative",display:"inline-block",marginBottom:20}}>
              <div style={{fontSize:80,animation:"floatY 4s ease-in-out infinite"}}>🎂</div>
              {["🎈","🎊","✨","🥳","🎁","⭐"].map((e,i)=>(
                <div key={i} style={{position:"absolute",fontSize:22,top:`${Math.sin(i*1.05)*40+50}%`,left:`${Math.cos(i*1.05)*60+50}%`,transform:"translate(-50%,-50%)",animation:`floatYR ${2.5+i*.4}s ease-in-out infinite`,animationDelay:`${i*.5}s`,opacity:.85}}>{e}</div>
              ))}
            </div>
            <div style={{display:"inline-block",background:"#0A0A14",border:"1px solid #7C3AED50",borderRadius:99,padding:"6px 20px",fontSize:12,color:"#7C3AED",fontWeight:800,marginBottom:18,letterSpacing:1}}>
              📸 FOTO + IA + TEMPLATES PREMIUM
            </div>
            <h1 style={{fontSize:50,fontWeight:900,color:"#fff",lineHeight:1.1,margin:"0 0 16px",textShadow:"0 0 80px rgba(124,58,237,.25)"}}>
              Convites que<br/>
              <span style={{background:"linear-gradient(135deg,#7C3AED,#EC4899,#F59E0B)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"200%",animation:"shimmer 4s linear infinite"}}>encantam de verdade</span>
            </h1>
            <p style={{fontSize:17,color:"#555",margin:"0 0 36px",lineHeight:1.7}}>
              Suba a foto do aniversariante, escolha o tema — nossa IA transforma em um convite único e inesquecível em segundos.
            </p>
            <div style={{display:"flex",justifyContent:"center",gap:32,marginBottom:36,flexWrap:"wrap"}}>
              {[["📸","Foto + IA"],["🎨","12+ temas"],["🔒","Marca d'água"],["📲","Print & Digital"]].map(([e,l])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:4,animation:"floatY 3s ease-in-out infinite"}}>{e}</div>
                  <div style={{fontSize:12,color:"#444",fontWeight:700}}>{l}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setStep(1)} style={{
              padding:"20px 56px",
              background:"linear-gradient(135deg,#7C3AED,#EC4899)",
              color:"#fff",border:"none",borderRadius:18,
              fontSize:18,fontWeight:900,cursor:"pointer",
              boxShadow:"0 8px 32px rgba(124,58,237,.5), 0 0 0 1px rgba(124,58,237,.3)",
              animation:"glow 2.5s ease-in-out infinite",letterSpacing:.5
            }}>🎉 Criar meu convite agora</button>
            <div style={{marginTop:14,fontSize:13,color:"#2A2A2A"}}>Grátis para visualizar • R$14,90 para baixar</div>
            <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:32,flexWrap:"wrap"}}>
              {["👑 Princesa","⚡ Super-Herói","🦄 Unicórnio","🎮 Gamer","🌈 Neon Party","📼 Anos 80/90"].map(tg=>(
                <div key={tg} style={{background:"#0A0A14",border:"1px solid #111",borderRadius:99,padding:"6px 14px",fontSize:12,color:"#444"}}>{tg}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{maxWidth:600,margin:"0 auto",padding:"0 20px 60px"}}>
          {step>0 && (
            <div style={{background:"rgba(10,10,20,.98)",backdropFilter:"blur(20px)",borderRadius:24,padding:"1.75rem",border:"1px solid #111",boxShadow:"0 20px 60px rgba(0,0,0,.7)"}}>
              <StepBar current={step-1} />

              {step===1 && (
                <div style={{animation:"fadeUp .4s ease"}}>
                  <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
                    <h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:"0 0 6px"}}>Para quem é a festa?</h2>
                    <p style={{color:"#555",margin:0,fontSize:14}}>Escolha o público para ver os temas certos</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                    {[{id:"infantil",label:"Infantil",emoji:"🧸",desc:"0 a 12 anos",sub:"Temas encantadores"},{id:"adolescente",label:"Adolescente",emoji:"🎧",desc:"13 a 17 anos",sub:"Temas modernos"}].map(c=>(
                      <div key={c.id} onClick={()=>setCategory(c.id)} style={{
                        border:`2px solid ${category===c.id?"#7C3AED":"#111"}`,
                        borderRadius:20,padding:"1.75rem 1rem",cursor:"pointer",textAlign:"center",
                        background:category===c.id?"rgba(124,58,237,.1)":"#0A0A14",
                        transition:"all .25s",transform:category===c.id?"scale(1.03)":"scale(1)",
                        boxShadow:category===c.id?"0 0 0 1px #7C3AED, 0 8px 24px rgba(124,58,237,.25)":"none",
                        animation:category===c.id?"glow 2.5s ease-in-out infinite":"none"
                      }}>
                        <div style={{fontSize:48,marginBottom:10,animation:`floatY ${c.id==="infantil"?3:4}s ease-in-out infinite`}}>{c.emoji}</div>
                        <div style={{fontSize:18,fontWeight:900,color:"#fff",marginBottom:4}}>{c.label}</div>
                        <div style={{fontSize:12,color:"#555"}}>{c.desc}</div>
                        <div style={{fontSize:12,color:"#444"}}>{c.sub}</div>
                        {category===c.id&&<div style={{marginTop:10,background:"#7C3AED",color:"#fff",borderRadius:99,padding:"4px 16px",display:"inline-block",fontSize:11,fontWeight:800}}>✓ Selecionado</div>}
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setStep(2)} disabled={!category} style={{width:"100%",padding:"15px",background:category?"linear-gradient(135deg,#7C3AED,#EC4899)":"#111",color:category?"#fff":"#333",border:"none",borderRadius:14,fontSize:16,fontWeight:900,cursor:category?"pointer":"not-allowed",boxShadow:category?"0 4px 20px rgba(124,58,237,.4)":"none",transition:"all .3s"}}>Continuar →</button>
                </div>
              )}

              {step===2 && (
                <div style={{animation:"fadeUp .4s ease"}}>
                  <div style={{textAlign:"center",marginBottom:"1.25rem"}}>
                    <h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:"0 0 6px"}}>Escolha o tema</h2>
                    <p style={{color:"#555",margin:0,fontSize:14}}>Cada tema tem visual e partículas exclusivos</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                    {THEMES[category].map(th=>(
                      <div key={th.id} onClick={()=>setTheme(th)} style={{
                        border:`2px solid ${theme?.id===th.id?th.accent:"#111"}`,
                        borderRadius:16,padding:"1rem .75rem",cursor:"pointer",textAlign:"center",
                        background:theme?.id===th.id?th.bg+"CC":"#0A0A14",
                        transition:"all .25s",transform:theme?.id===th.id?"scale(1.05)":"scale(1)",
                        boxShadow:theme?.id===th.id?`0 0 0 1px ${th.accent}, 0 8px 20px ${th.accent}30`:"none"
                      }}>
                        <div style={{fontSize:30,marginBottom:6,animation:theme?.id===th.id?"floatY 2s ease-in-out infinite":"none"}}>{th.emoji}</div>
                        <div style={{fontSize:13,fontWeight:800,color:"#fff",marginBottom:3}}>{th.name}</div>
                        {theme?.id===th.id&&<div style={{background:th.accent,color:"#000",borderRadius:99,padding:"3px 10px",display:"inline-block",fontSize:10,fontWeight:900,marginTop:4}}>✓</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12}}>
                    <button onClick={()=>setStep(1)} style={{padding:"13px",background:"#111",border:"1px solid #1A1A2E",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",color:"#aaa"}}>← Voltar</button>
                    <button onClick={()=>setStep(3)} disabled={!theme} style={{padding:"13px",background:theme?`linear-gradient(135deg,${t.accent},${t.frame})`:"#111",color:theme?"#000":"#333",border:"none",borderRadius:14,fontSize:15,fontWeight:900,cursor:theme?"pointer":"not-allowed",boxShadow:theme?`0 4px 20px ${t.accent}50`:"none",transition:"all .3s"}}>Adicionar Foto ✨</button>
                  </div>
                </div>
              )}

              {step===3&&theme&&<PhotoStep photo={photo} setPhoto={setPhoto} theme={t} aiResult={aiResult} setAiResult={setAiResult} analyzing={analyzing} setAnalyzing={setAnalyzing} onBack={()=>setStep(2)} onNext={()=>setStep(4)} />}
              {step===4&&theme&&<DataStep formData={formData} setFormData={setFormData} theme={t} onBack={()=>setStep(3)} onNext={()=>setStep(5)} />}
              {step===5&&theme&&<PreviewStep data={formData} theme={t} photo={photo} aiResult={aiResult} onBack={()=>setStep(4)} onRestart={restart} triggerConfetti={()=>setConfetti(true)} />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
