/* ══ T5: HEISENBERG ══ */
window.heis3dInit=false;
function uH(){
  const dx=parseFloat(document.getElementById('dx').value);
  const dp=0.5/dx;
  const prod=dx*dp;
  document.getElementById('dxv').textContent=dx.toFixed(2);
  document.getElementById('hv-dx').textContent=dx.toFixed(2);
  document.getElementById('hv-dp').textContent=dp.toFixed(3);
  document.getElementById('hv-prod').textContent=prod.toFixed(3);
  const ok=prod>=0.499;
  const st=document.getElementById('heis-status');
  st.textContent=ok?t('t5.status.ok'):t('t5.status.violation');
  st.style.borderColor=ok?'rgba(0,240,160,.3)':'rgba(255,68,102,.3)';
  st.style.color=ok?'var(--green)':'var(--red)';
  drawHeis(dx,dp);
}
function drawHeis(dx,dp){
  const c=document.getElementById('heis-canvas');
  if(!c)return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#020810';ctx.fillRect(0,0,W,H);
  // position wave
  const sigma=dx*10;
  ctx.beginPath();ctx.strokeStyle='rgba(0,200,240,0.8)';ctx.lineWidth=1.5;
  for(let x=0;x<=W;x++){
    const xv=(x-W/2)/10;
    const y=H*0.3-Math.exp(-xv*xv/(2*sigma*sigma))*H*0.22;
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  // momentum wave
  const sigmaP=0.5/dx;
  ctx.beginPath();ctx.strokeStyle='rgba(160,96,255,0.7)';ctx.lineWidth=1.5;
  for(let x=0;x<=W;x++){
    const xv=(x-W/2)/10;
    const y=H*0.7-Math.exp(-xv*xv/(2*sigmaP*sigmaP))*H*0.22;
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.font='10px JetBrains Mono,monospace';
  ctx.fillStyle='rgba(0,200,240,.6)';ctx.fillText(t('t5.canvas.pos'),8,16);
  ctx.fillStyle='rgba(160,96,255,.6)';ctx.fillText(t('t5.canvas.mom'),8,H/2+24);
}

function initHeis3DInner(){
  window.heis3dInit=true;
  const canvas=document.getElementById('heis3d');
  if(!canvas||!window.THREE)return;
  const S=window.heis3d||{};
  if(S.raf){cancelAnimationFrame(S.raf);try{S.r.dispose()}catch(e){}}
  if(S.cleanup)try{S.cleanup()}catch(e){}
  window.heis3dLost=false;
  const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  r.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  r.setSize(canvas.clientWidth,200);
  r.setClearColor(0x020810,1);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(50,canvas.clientWidth/200,0.1,100);
  cam.position.set(4,3,6);cam.lookAt(0,0,0);
  // phase space ellipse
  const pts=[];
  for(let i=0;i<=200;i++){
    const tt=(i/200)*Math.PI*2;
    const dx=parseFloat(document.getElementById('dx')?document.getElementById('dx').value:1);
    const dp=0.5/dx;
    pts.push(new THREE.Vector3(dx*Math.cos(tt)*1.5,dp*Math.sin(tt)*1.5,0));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  scene.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x00c8f0,opacity:.8,transparent:true})));
  // axes
  [[1,0,0,0xff4466],[0,1,0,0x00f0a0],[0,0,1,0xa060ff]].forEach(([x,y,z,c])=>{
    const g2=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(x*2,y*2,z*2)]);
    scene.add(new THREE.Line(g2,new THREE.LineBasicMaterial({color:c,opacity:.4,transparent:true})));
  });
  let drag=false,ox=0,oy=0,rotX=0,rotY=0;
  const h={
    md:e=>{drag=true;ox=e.clientX;oy=e.clientY},
    ts:e=>{drag=true;ox=e.touches[0].clientX;oy=e.touches[0].clientY},
    mu:()=>{drag=false},
    tu:()=>{drag=false},
    mm:e=>{if(!drag)return;rotY+=(e.clientX-ox)*.01;rotX+=(e.clientY-oy)*.01;ox=e.clientX;oy=e.clientY},
    tm:e=>{if(!drag)return;rotY+=(e.touches[0].clientX-ox)*.01;rotX+=(e.touches[0].clientY-oy)*.01;ox=e.touches[0].clientX;oy=e.touches[0].clientY},
  };
  h.lost=()=>{window.heis3dLost=true};
  h.restore=()=>{window.heis3dLost=false;setTimeout(()=>{try{initHeis3D()}catch(e){}},20)};
  h.vis=()=>{if(!document.hidden)setTimeout(()=>{if(window.heis3dLost)try{initHeis3D()}catch(e){}else if(window.heis3d){try{window.heis3d.r.render(window.heis3d.scene,window.heis3d.cam)}catch(e){}}},30)};
  h.cleanup=()=>{
    canvas.removeEventListener('mousedown',h.md);
    canvas.removeEventListener('touchstart',h.ts);
    window.removeEventListener('mouseup',h.mu);
    window.removeEventListener('touchend',h.tu);
    window.removeEventListener('mousemove',h.mm);
    window.removeEventListener('touchmove',h.tm);
    canvas.removeEventListener('webglcontextlost',h.lost);
    canvas.removeEventListener('webglcontextrestored',h.restore);
    document.removeEventListener('visibilitychange',h.vis);
  };
  canvas.addEventListener('mousedown',h.md);
  canvas.addEventListener('touchstart',h.ts,{passive:true});
  window.addEventListener('mouseup',h.mu);
  window.addEventListener('touchend',h.tu);
  window.addEventListener('mousemove',h.mm);
  window.addEventListener('touchmove',h.tm,{passive:true});
  canvas.addEventListener('webglcontextlost',h.lost,false);
  canvas.addEventListener('webglcontextrestored',h.restore,false);
  document.addEventListener('visibilitychange',h.vis,{passive:true});
  const state={r,scene,cam};
  function anim(){
    state.raf=requestAnimationFrame(anim);
    if(window.heis3dLost)return;
    if(mq.matches)return;
    scene.rotation.y+=0.005+rotY*.05;
    scene.rotation.x=rotX*.3;
    try{r.render(scene,cam)}catch(e){window.heis3dLost=true}
  }
  state.raf=requestAnimationFrame(anim);
  state.cleanup=h.cleanup;
  window.heis3d=state;
  if(mq.matches)try{r.render(scene,cam)}catch(e){}
}
function initHeis3D(){
  try{initHeis3DInner()}catch(e){window.heis3dLost=true}
}
function heisFail(on){
  const c=document.getElementById('heis3d');
  if(!c)return;
  if(on)c.style.background='radial-gradient(100% 100% at 50% 30%,#0a1a3a 0%,#04101f 60%,#01060c 100%)';
  else c.style.background='';
}
function heisWatch(){
  const canvas=document.getElementById('heis3d');
  if(!canvas)return;
  if(!window.THREE){window.heisFails=(window.heisFails||0)+1;if(window.heisFails>2)heisFail(true);return}
  const S=window.heis3d;
  if(!S){
    if(window.heis3dInit&&!window.heis3dBusy){
      window.heis3dBusy=true;
      initHeis3D();
      if(!window.heis3d){window.heisFails=(window.heisFails||0)+1;if(window.heisFails>2)heisFail(true)}else{window.heisFails=0;heisFail(false)}
      window.heis3dBusy=false;
    }
    return;
  }
  let gl=null;
  try{gl=S.r&&S.r.getContext?S.r.getContext():null}catch(e){}
  const lost=!!(gl&&typeof gl.isContextLost==='function'&&gl.isContextLost());
  if(lost){
    if(!window.heis3dBusy){
      window.heis3dBusy=true;
      window.heis3dLost=true;
      initHeis3D();
      if(!window.heis3d){window.heisFails=(window.heisFails||0)+1;if(window.heisFails>2)heisFail(true)}else{window.heisFails=0;heisFail(false)}
      setTimeout(()=>{window.heis3dBusy=false},2000);
    }
  }else{
    window.heis3dBusy=false;
    if(window.heisFails){window.heisFails=0;heisFail(false)}
    if(window.heis3dLost)window.heis3dLost=false;
  }
}
if(!window.heis3dWatch){window.heis3dWatch=setInterval(heisWatch,2500);}
