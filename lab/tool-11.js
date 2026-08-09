/* ══ T11: TUNNELING ══ */
let tunRaf=null,tunPkt=null;
function tunPreset(k){
  const set=(e,v,w)=>{document.getElementById(e).value=v;};
  if(k==='alpha'){set('tun-es',150);set('tun-bs',300);set('tun-ws',40)}
  else if(k==='stm'){set('tun-es',200);set('tun-bs',400);set('tun-ws',30)}
  else if(k==='flash'){set('tun-es',350);set('tun-bs',400);set('tun-ws',95)}
  tunCalc();
}
function tunCalc(){
  const E=+document.getElementById('tun-es').value/100;
  const V=+document.getElementById('tun-bs').value/100;
  const a=+document.getElementById('tun-ws').value/100;
  document.getElementById('tun-ev').textContent=E.toFixed(1)+' eV';
  document.getElementById('tun-bv').textContent=V.toFixed(1)+' eV';
  document.getElementById('tun-wv').textContent=a.toFixed(2)+' nm';
  let T,kappa;
  if(E<V){
    kappa=5.12*Math.sqrt(V-E);
    const z=kappa*a;
    T=1/(1+(V*V*Math.sinh(z)*Math.sinh(z))/(4*E*(V-E)));
  }else{
    const k2=5.12*Math.sqrt(E-V);
    const z=k2*a;
    T=1/(1+(V*V*Math.sin(z)*Math.sin(z))/(4*E*(E-V)));
  }
  T=Math.max(0,Math.min(1,isFinite(T)?T:0));
  document.getElementById('tun-tv').textContent=T>1e-4?(T*100).toFixed(T>0.1?1:3)+' %':T.toExponential(1);
  document.getElementById('tun-kv').textContent=kappa!==undefined?kappa.toFixed(2)+' nm⁻¹':'—';
  document.getElementById('tun-rv').textContent=(100-T*100).toFixed(1)+' %';
  tunStart(T,E,V,a);
}
function tunStart(T,E,V,a){
  const c=document.getElementById('tun-canvas');
  if(!c)return;
  c._p={T,E,V,a};
  if(tunRaf)cancelAnimationFrame(tunRaf);
  tunPkt={p:-80,amp:1,ref:null};
  tunLoop(c);
}
function tunLoop(c){
  const ctx=c.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  const w=c.clientWidth,h=320;
  c.width=w*dpr;c.height=h*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const {T,E,V,a}=c._p;
  const bl=w*0.42,br=bl+Math.max(18,Math.min(90,a*140));
  const energyY=h-40-(E/V)*Math.min(150,h*0.45);
  const k=0.14,sigma=26;
  const wallV=Math.min(160,h*0.5);
  const p=tunPkt.p;

  ctx.clearRect(0,0,w,h);
  /* floor */
  ctx.strokeStyle='rgba(0,200,240,.25)';ctx.beginPath();ctx.moveTo(0,h-30);ctx.lineTo(w,h-30);ctx.stroke();
  /* barrier */
  ctx.fillStyle='rgba(120,90,255,.22)';ctx.fillRect(bl,h-30-wallV,br-bl,wallV);
  ctx.strokeStyle='rgba(160,130,255,.8)';ctx.lineWidth=1.5;
  ctx.strokeRect(bl,h-30-wallV,br-bl,wallV);
  ctx.font='11px monospace';ctx.fillStyle='rgba(160,130,255,.9)';
  ctx.textAlign='center';
  ctx.fillText('V₀='+V.toFixed(1)+' eV',(bl+br)/2,h-30-wallV-8);
  /* energy line */
  ctx.strokeStyle='rgba(0,200,240,.6)';ctx.setLineDash([5,4]);
  ctx.beginPath();ctx.moveTo(0,energyY);ctx.lineTo(w,energyY);ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='rgba(0,200,240,.8)';ctx.textAlign='right';
  ctx.fillText('E='+E.toFixed(1)+' eV',w-8,energyY-6);

  drawPkt(tunPkt.p,tunPkt.amp,k,sigma,bl,br,'#00c8f0');
  if(tunPkt.ref)drawPkt(tunPkt.ref.p,tunPkt.ref.amp,k,sigma,bl,br,'rgba(255,150,60,.9)');

  /* motion */
  const sp=2.6;
  if(tunPkt.p<br){
    tunPkt.p+=sp;
    if(!tunPkt.ref&&tunPkt.p>bl){} 
  }
  if(tunPkt.p>=bl&&!tunPkt.ref){
    tunPkt.ref={p:bl-4,amp:Math.sqrt(1-T)};
    tunPkt.amp=Math.sqrt(T);
    tunPkt.p=br+4;
  }
  if(tunPkt.ref&&tunPkt.ref.p>-60){tunPkt.ref.p-=sp}
  if(tunPkt.p>w+80&&tunPkt.ref&&tunPkt.ref.p<-60){tunPkt.p=-80;tunPkt.ref=null}
  tunRaf=requestAnimationFrame(()=>tunLoop(c));

  function drawPkt(cx,amp,k,sigma,bl,br,color){
    ctx.beginPath();
    for(let x=0;x<=w;x+=3){
      const inBarrier=x>bl&&x<br;
      const dx=x-cx;
      const env=amp*Math.exp(-(dx*dx)/(2*sigma*sigma));
      const wave=env*Math.cos(k*dx);
      const yy=h-30-wave;
      if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);
    }
    ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.stroke();
  }
}
