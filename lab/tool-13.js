/* ══ T13: QUANTUM WALK (3D) ══ */
let qwN=60,qwP=0.5,qwObs=false;
let qwA=null,qwB=null,qwPos=0,qwStepCount=0,qwTimer=null;
let q3w=null,q3Bars=[],q3C=[],qwCls=null;
window._stop3d=window._stop3d||{};
window._stop3d[13]=()=>{if(qwTimer){clearTimeout(qwTimer);qwTimer=null}if(window.Q3D&&q3w){q3w.stop();q3w=null}q3Bars=[];q3C=[]};
function qwSet(){
  qwN=+document.getElementById('qw-steps').value||60;
  qwP=(+document.getElementById('qw-bias').value||50)/100;
  qwObs=!!document.getElementById('qw-observe')&&document.getElementById('qw-observe').checked;
  const a=document.getElementById('qw-sv'),b=document.getElementById('qw-bv');
  if(a)a.textContent=qwN;if(b)b.textContent=qwP.toFixed(2);
  qwInit();
  if(window.Q3D&&!q3w){qwBuild()}
  else if(q3w&&q3w._curN!==qwN){qwBuild()}
  qwDraw();
}
function qwReset(){
  if(qwTimer){clearTimeout(qwTimer);qwTimer=null}
  qwSet();
}
function qwInit(){
  const n=2*qwN+1,h=Math.SQRT1_2;
  qwA=new Float64Array(n);qwB=new Float64Array(n);
  qwA[qwN]=h;qwB[qwN]=h;qwPos=qwN;qwStepCount=0;
}
function qwStart(){qwReset();qwRun()}
function qwRun(){
  qwInit();
  if(window.Q3D&&!q3w)qwBuild();
  qwCls=classicalRow();
  qwDraw();
  let i=0;
  const step=async()=>{
    const tb=document.getElementById('tb13');
    if(!tb||!tb.classList.contains('open')){qwTimer=null;return}
    if(i>=qwN){qwDraw();return}
    i++;
    await qwStep(qwObs);
    qwDraw();
    qwTimer=setTimeout(step,70);
  };
  if(qwTimer){clearTimeout(qwTimer);qwTimer=null}
  step();
}
async function qwStep(observe){
  const n=2*qwN+1,h=Math.SQRT1_2;
  if(observe){
    let r;
    try{r=(await Qrng.bits(1))&1}catch(e){r=Math.random()<0.5?0:1}
    const p=Math.random()<qwP?1:0;
    qwPos+=p?1:-1;
    if(qwPos<0)qwPos=0;if(qwPos>=n)qwPos=n-1;
    qwA=new Float64Array(n);qwB=new Float64Array(n);
    qwA[qwPos]=h;qwB[qwPos]=h;
  }else{
    const a=qwA.slice(0),b=qwB.slice(0);
    const A=new Float64Array(n),B=new Float64Array(n);
    for(let i=0;i<n;i++){
      if(a[i]===0&&b[i]===0)continue;
      const u=(a[i]+b[i])*h,d=(a[i]-b[i])*h;
      if(i+1<n)B[i+1]+=u;
      if(i-1>=0)A[i-1]+=d;
    }
    qwA=A;qwB=B;
  }
  qwStepCount++;
}
function classicalRow(){
  let row=new Float64Array(1);row[0]=1;
  const n=2*qwN+1;
  for(let s=0;s<qwN;s++){
    const nr=new Float64Array(row.length+1);
    for(let i=0;i<row.length;i++){nr[i]+=row[i]*0.5;nr[i+1]+=row[i]*0.5}
    row=nr;
  }
  const out=new Float64Array(n),off=qwN-((row.length-1)>>1),mxC=Math.max(...row,1e-9);
  for(let i=0;i<row.length;i++){const idx=off+i;if(idx>=0&&idx<n)out[idx]=row[i]/mxC}
  return out;
}
function qwProbs(){
  const n=2*qwN+1,out=new Float64Array(n);let mx=1e-9;
  for(let i=0;i<n;i++){out[i]=qwA[i]*qwA[i]+qwB[i]*qwB[i];if(out[i]>mx)mx=out[i]}
  for(let i=0;i<n;i++)out[i]/=mx;
  return out;
}
function qwBuild(){
  if(!q3w)return;
  const g=q3w.g;
  if(q3w._bg){g.remove(q3w._bg)}
  const bg=new THREE.Group();
  const grid=new THREE.BufferGeometry(),pts=[];
  for(let i=-qwN;i<=qwN;i++){pts.push(new THREE.Vector3(i*0.32,-1.45,-0.6),new THREE.Vector3(i*0.32,-1.45,0.6))}
  grid.setFromPoints(pts);
  bg.add(new THREE.Line(grid,new THREE.LineBasicMaterial({color:0x123a52,transparent:true,opacity:0.5})));
  q3Bars=[];q3C=[];
  const geo=new THREE.BoxGeometry(0.24,1,0.24),gc=new THREE.BoxGeometry(0.16,1,0.16);
  for(let i=0;i<2*qwN+1;i++){
    const m=new THREE.Mesh(geo,Q3D.m(Q3D.CYAN,0.9));
    m.position.x=(i-qwN)*0.32;bg.add(m);q3Bars.push(m);
    const mc=new THREE.Mesh(gc,Q3D.m(0x8040c0,0.55));
    mc.position.set((i-qwN)*0.32,0,-0.85);bg.add(mc);q3C.push(mc);
  }
  const ax=new THREE.BufferGeometry();
  ax.setFromPoints([new THREE.Vector3(-qwN*0.32-0.6,-0.25,0),new THREE.Vector3(qwN*0.32+0.6,-0.25,0)]);
  bg.add(new THREE.Line(ax,new THREE.LineBasicMaterial({color:0x00c8f0,transparent:true,opacity:0.35})));
  g.add(bg);q3w._bg=bg;q3w._curN=qwN;
}
function qwDraw(){
  const p=qwProbs();
  if(q3w&&q3Bars.length){
    for(let i=0;i<q3Bars.length;i++){
      const v=p[i];
      q3Bars[i].scale.set(1,Math.max(0.01,v*2.6),1);
      q3Bars[i].position.y=-1.45+v*1.3;
      q3Bars[i].material.color.setHSL(0.53-v*0.15,0.9,0.45+v*0.25);
      q3Bars[i].material.opacity=0.3+v*0.65;
      const cv=qwCls?(qwCls[i]||0):0;
      q3C[i].scale.set(1,Math.max(0.01,cv*1.8),1);
      q3C[i].position.y=-1.45+cv*0.9;
    }
  }else{
    drawWalk2d(p);
  }
  const st=document.getElementById('qw-stepv');
  if(st)st.textContent=t('t13.canvas.step').replace('{0}',qwStepCount).replace('{1}',qwN)+'   σq ≈ '+(sigma(p)*1.3).toFixed(1);
  const lq=document.getElementById('qw-legq');
  if(lq)lq.innerHTML='<span class="sw swq"></span>'+t('t13.canvas.quantum')+' <span style="opacity:.45">·</span> <span class="sw swc"></span>'+t('t13.canvas.classical');
}
function sigma(p){
  let m=0,m2=0,s=0;
  for(let i=0;i<p.length;i++){m+=p[i]*i;m2+=p[i]*i*i;s+=p[i]}
  if(!s)return 0;
  return Math.sqrt(Math.max(0,m2/s-(m/s)*(m/s)));
}
function drawWalk2d(ps){
  const c=document.getElementById('qw-canvas');if(!c)return;
  const ctx=c.getContext('2d');
  const w=c.clientWidth||520,h=c.clientHeight||300;
  const dpr=window.devicePixelRatio||1;c.width=w*dpr;c.height=h*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='rgba(2,8,16,.96)';ctx.fillRect(0,0,w,h);
  const n=ps.length,bw=Math.min(14,(w-40)/n);
  for(let i=0;i<n;i++){
    const x=w/2+(i-qwN)*bw,hh=ps[i]*Math.min(90,h*0.4);
    ctx.fillStyle='rgba(0,200,240,'+(0.25+0.7*ps[i]).toFixed(2)+')';
    ctx.fillRect(x-bw/3,h-30-hh,bw*0.66,hh);
  }
  ctx.fillStyle='rgba(0,200,240,.85)';ctx.font='11px monospace';
  ctx.fillText(t('t13.canvas.quantum'),12,18);
}