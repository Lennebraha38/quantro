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

function initHeis3D(){
  window.heis3dInit=true;
  const canvas=document.getElementById('heis3d');
  if(!canvas||!window.THREE)return;
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
    const t=(i/200)*Math.PI*2;
    const dx=parseFloat(document.getElementById('dx')?document.getElementById('dx').value:1);
    const dp=0.5/dx;
    pts.push(new THREE.Vector3(dx*Math.cos(t)*1.5,dp*Math.sin(t)*1.5,0));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  scene.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x00c8f0,opacity:.8,transparent:true})));
  // axes
  [[1,0,0,0xff4466],[0,1,0,0x00f0a0],[0,0,1,0xa060ff]].forEach(([x,y,z,c])=>{
    const g2=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(x*2,y*2,z*2)]);
    scene.add(new THREE.Line(g2,new THREE.LineBasicMaterial({color:c,opacity:.4,transparent:true})));
  });
  let drag=false,ox=0,oy=0,rotX=0,rotY=0;
  canvas.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY});
  canvas.addEventListener('touchstart',e=>{drag=true;ox=e.touches[0].clientX;oy=e.touches[0].clientY},{passive:true});
  window.addEventListener('mouseup',()=>drag=false);
  window.addEventListener('touchend',()=>drag=false);
  window.addEventListener('mousemove',e=>{if(!drag)return;rotY+=(e.clientX-ox)*.01;rotX+=(e.clientY-oy)*.01;ox=e.clientX;oy=e.clientY});
  window.addEventListener('touchmove',e=>{if(!drag)return;rotY+=(e.touches[0].clientX-ox)*.01;rotX+=(e.touches[0].clientY-oy)*.01;ox=e.touches[0].clientX;oy=e.touches[0].clientY},{passive:true});
  function anim(){
    requestAnimationFrame(anim);
    if(mq.matches)return;
    scene.rotation.y+=0.005+rotY*.05;
    scene.rotation.x=rotX*.3;
    r.render(scene,cam);
  }
  anim();
}
