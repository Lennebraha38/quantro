/* ══ T10: SCHRODINGER CAT (3D) ══ */
let catP=0.5,catState='super',catT=0,catLog=[],catObj=null;
window._stop3d=window._stop3d||{};
window._stop3d[10]=()=>{if(window.Q3D&&catObj&&catObj.o)catObj.stop();catObj=null};
function catSetP(){
  catP=+document.getElementById('cat-ps').value/100;
  document.getElementById('cat-pv').textContent=Math.round(catP*100)+'%';
  catT=0;catDraw();
}
function catStart(){catDraw()}
function catReset(){
  catState='super';catT=0;
  const go=document.getElementById('cat-go');
  go.disabled=false;go.innerHTML=t('t10.open');
  catDraw();
}
async function catOpen(){
  if(catState!=='super'){catReset();return}
  const go=document.getElementById('cat-go');
  go.disabled=true;
  const settle=(rnd,label)=>{
    const decayed=rnd<catP;
    catState=decayed?'dead':'alive';
    catLog.unshift({alive:!decayed});
    if(catLog.length>12)catLog.pop();
    go.innerHTML=decayed?'💀 '+t('t10.open'):'🐱 '+t('t10.open');
    go.disabled=false;
    const src=document.getElementById('cat-src');
    if(src)src.textContent=label;
    catDraw();
    updateCatLog();
  };
  try{
    const rnd=await Qrng.prob();
    settle(rnd,t(Qrng.label()));
  }catch(e){
    const j=await fetch('/api/anu?length=1').then(r=>r.json()).catch(()=>null);
    if(j&&j.success&&j.data&&j.data[0]!==undefined)settle(j.data[0]/255,t('stat.proxy'));
    else settle(Math.random(),t('stat.none'));
  }
}
function updateCatLog(){
  const alive=catLog.filter(x=>x.alive).length;
  const el=document.getElementById('cat-log2');
  if(el)el.innerHTML=`<div>${t('t10.log.ready')}</div><div style="margin-top:8px"><span>●</span> ${t('t10.canvas.stats.alive')}: ${alive} &nbsp; <span>●</span> ${t('t10.canvas.stats.dead')}: ${catLog.length-alive} &nbsp; <span>●</span> ${t('t10.canvas.stats.total')}: ${catLog.length}</div>`;
}
function catEnsure(){
  if(catObj&&catObj.o&&!catObj.dead)return catObj;
  if(!window.Q3D||!window.THREE)return null;
  const o=Q3D.mount('cat-canvas',{cam:[1.5,1.7,4.4],fov:45,look:[0,-0.2,0],amb:.72,autoRot:true});
  if(!o)return null;
  const g=o.g;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(2.7,1.8,1.8),Q3D.m(0x0a1c33,0.34)));
  const ed=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.7,1.8,1.8)),new THREE.LineBasicMaterial({color:0x00c8f0,transparent:true,opacity:0.5}));
  g.add(ed);
  g.add(Q3D.ring(1.6,0x0e3a55,48,0.18));
  const atm=new THREE.Mesh(new THREE.SphereGeometry(0.22,24,16),Q3D.m(0x00c8f0,0.95));
  atm.position.set(-0.85,-0.35,0.2);g.add(atm);o._atm=atm;
  const orb=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.014,8,48),Q3D.m(0x00e0ff,0.7));
  orb.position.copy(atm.position);g.add(orb);o._orb=orb;
  const flask=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.2,0.5,20),Q3D.m(0x50ffa0,0.55));
  flask.position.set(0.05,-0.15,0);g.add(flask);o._flask=flask;
  const catA=Q3D.glow('rgba(80,255,176,0.95)',0.95);
  const catD=Q3D.glow('rgba(255,70,90,0.95)',0.95);
  catA.position.set(0.55,-0.35,0.75);catD.position.set(-0.55,-0.4,-0.75);
  g.add(catA);g.add(catD);o._catA=catA;o._catD=catD;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(5,4),Q3D.m(0x020810,0.6));
  pl.rotation.x=-Math.PI/2;pl.position.y=-0.95;g.add(pl);
  o.on.update=o=>{
    catT+=0.03;
    const t=catT,pul=0.6+0.4*Math.sin(t*3);
    o._atm.scale.setScalar(1+0.45*pul);
    o._atm.material.opacity=0.3+0.6*pul;
    o._orb.rotation.z=t*1.7;o._orb.rotation.x=Math.sin(t)*0.4;
    if(catState==='super'){
      o._catA.material.opacity=0.34+0.28*Math.sin(t*4);
      o._catD.material.opacity=0.34-0.28*Math.sin(t*4);
      o._flask.material.color.setHex(0x50ffa0);
    }else if(catState==='alive'){
      o._catA.material.opacity=0.85+0.1*Math.sin(t*3);
      o._catD.material.opacity=0.05;
      o._flask.material.color.setHex(0x50ffa0);o._flask.material.opacity=0.75;
    }else{
      o._catA.material.opacity=0.05;
      o._catD.material.opacity=0.85+0.1*Math.sin(t*3);
      o._flask.material.color.setHex(0xff4466);o._flask.material.opacity=0.85;
    }
  };
  catObj={o,dead:false,stop:function(){if(this.o){this.o.stop();this.o=null}this.dead=true}};
  return catObj;
}
function catOv(){
  const el=document.getElementById('cat-ov');
  if(!el)return;
  if(catState==='super'){
    el.textContent='|ψ⟩ = √(1−p)·|canlı⟩ + √p·|ölü⟩  ·  '+(catP*100).toFixed(0)+'%  ·  '+t('t10.canvas.detector.paused');
  }else{
    el.textContent=(catState==='alive'?t('t10.canvas.alive.label'):t('t10.canvas.dead.label'))+'  ·  '+t('t10.canvas.detector.collapsed');
  }
}
function catDraw(){
  const o=catEnsure();
  if(o)catOv();
  else drawCat2d();
}
function drawCat2d(){
  const c=document.getElementById('cat-canvas');
  if(!c)return;
  const ctx=c.getContext('2d');
  const dpr=window.devicePixelRatio||1,w=c.clientWidth||520,h=380;
  c.width=w*dpr;c.height=h*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#040a14';ctx.fillRect(0,0,w,h);
  catT+=0.03;
  const bx=w*0.16,by=h*0.12,bw=w*0.68,bh=h*0.62;
  roundRectWrap(ctx,bx,by,bw,bh,8);
  const ix=bx+18,iy=by+22,iw=bw-36,ih=bh-42;
  const ax=ix+40,ay=iy+ih-70;
  const pul=0.5+0.5*Math.sin(catT*3);
  ctx.fillStyle='rgba(0,200,240,'+(0.2+0.4*pul)+')';
  ctx.beginPath();ctx.arc(ax,ay,26,0,7);ctx.fill();
  ctx.strokeStyle='#00c8f0';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(ax,ay,15,0,7);ctx.stroke();
  const cxm=ix+iw-70,cym=iy+ih-44;
  ctx.font='64px serif';ctx.textAlign='center';ctx.textBaseline='middle';
  if(catState==='super'){
    ctx.fillStyle='rgba(127,255,176,.5)';ctx.fillText('🐱',cxm-6,cym-4);
    ctx.fillStyle='rgba(255,107,107,.5)';ctx.fillText('😿',cxm+6,cym+4);
  }else if(catState==='alive'){
    ctx.fillStyle='#7dffb0';ctx.fillText('🐱',cxm,cym);
    ctx.fillStyle='#22cc77';
  }else{
    ctx.fillStyle='#ff6b6b';ctx.fillText('😿',cxm,cym);
    ctx.fillStyle='#ff3355';
  }
  ctx.font='bold 14px monospace';
  ctx.fillText(catState==='super'?t('t10.canvas.detector.paused'):(catState==='alive'?t('t10.canvas.alive.label'):t('t10.canvas.dead.label')),w/2,h-18);
}
function roundRectWrap(ctx,x,y,w,h,r){
  ctx.fillStyle='rgba(9,20,38,.9)';
  ctx.strokeStyle='rgba(0,200,240,.35)';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  ctx.fill();ctx.stroke();
}