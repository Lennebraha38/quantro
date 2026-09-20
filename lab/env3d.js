// ═════════════════════════════════════════════════════════
// QUANTRO · DERİN ALAN ORTAMI (env3d)
//   Açılan her aracın ardında çalışan gerçek zamanlı kuantum/astro
//   sahnedir: yıldız alanı, bulutsular ve odaklanan aracın --ac
//   rengine kilitlenen "kuantum çekirdek" (dolanık halka + yörünge
//   qubit düğümleri). Three.js r128 · zero-dependency (THREE hazır).
// ═════════════════════════════════════════════════════════
window.Env3D=(()=>{
  'use strict';
  if(!window.THREE)return{noop:true};
  let canvas,renderer,scene,camera,camPos=null;
  let stars=null,bright=null,nebulas=[],coreGroup=null,ico=null,rings=[],nodes=[],link=null,glow=null,pulseMesh=null,pulseMat=null;
  let raf=0,last=0,frames=0,fps=0,lostPrivate=false;
  let focusN=0,focusT=0,cur=null,tgt=null,spin=0,spinT=0,pulse=0;
  let ptrX=0,ptrY=0,px=0,py=0;
  const DPI=Math.min(window.devicePixelRatio||1,1.75);
  const reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const _META={1:{s:1.0,c:1.0},2:{s:.9,c:1.25},3:{s:.7,c:.85},4:{s:1.15,c:1.05},5:{s:1.65,c:.65},
    6:{s:1.85,c:.55},7:{s:1.4,c:.7},8:{s:1.1,c:1.0},9:{s:.8,c:1.2},10:{s:1.35,c:.75},
    11:{s:1.0,c:1.1},12:{s:1.2,c:.9},13:{s:1.0,c:1.1}};
  const _DEF=new THREE.Color('#00c8f0');

  function texCircle(r,g,b){
    const c=document.createElement('canvas');c.width=c.height=64;
    const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba('+r+','+g+','+b+',1)');
    gr.addColorStop(.45,'rgba('+r+','+g+','+b+',.45)');
    gr.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
    x.fillStyle=gr;x.fillRect(0,0,64,64);
    const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t;
  }
  function texNebula(){
    const c=document.createElement('canvas');c.width=c.height=256;
    const x=c.getContext('2d');
    const gr=x.createRadialGradient(128,128,0,128,128,128);
    gr.addColorStop(0,'rgba(255,255,255,.16)');
    gr.addColorStop(.35,'rgba(255,255,255,.08)');
    gr.addColorStop(.7,'rgba(255,255,255,.028)');
    gr.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=gr;x.fillRect(0,0,256,256);
    for(let i=0;i<26;i++){
      const a=Math.random()*Math.PI*2,rr=Math.random()*95+14;
      const xx=128+Math.cos(a)*rr,yy=128+Math.sin(a)*rr;
      const g2=x.createRadialGradient(xx,yy,0,xx,yy,Math.random()*40+12);
      g2.addColorStop(0,'rgba(255,255,255,'+(Math.random()*.09+.03)+')');
      g2.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g2;x.fillRect(0,0,256,256);
    }
    const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t;
  }

  function makeCore(){
    coreGroup=new THREE.Group();
    const ic=new THREE.IcosahedronGeometry(1.85,1);
    ico=new THREE.LineSegments(new THREE.EdgesGeometry(ic),new THREE.LineBasicMaterial({color:0x9fd4ff,transparent:true,opacity:.38}));
    const ic2=new THREE.IcosahedronGeometry(1.45,1);
    ico2=new THREE.LineSegments(new THREE.EdgesGeometry(ic2),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.16}));
    coreGroup.add(ico,ico2);
    const ringsGeo=new THREE.TorusGeometry(2.75,.014,8,130);
    const ring1=new THREE.Mesh(ringsGeo,new THREE.MeshBasicMaterial({color:0x00c8f0,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
    const ring2=new THREE.Mesh(ringsGeo,new THREE.MeshBasicMaterial({color:0x00c8f0,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
    ring2.scale.setScalar(1.18);ring1.rotation.x=Math.PI/2.4;ring2.rotation.x=-Math.PI/2.4;
    rings=[ring1,ring2];coreGroup.add(ring1,ring2);
    glow=new THREE.Sprite(new THREE.SpriteMaterial({map:texCircle(80,180,255),color:0x00c8f0,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
    glow.scale.set(12,12,1);coreGroup.add(glow);
    for(let i=0;i<5;i++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(.15,14,14),
        new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
      m.userData={a:i/5*Math.PI*2+e(2),sp:e(1)*(i%2?.0105:.0082),r:2.75};
      nodes.push(m);coreGroup.add(m);
    }
    const lg=new THREE.BufferGeometry();
    lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(15),3));
    link=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0x7fd6ff,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));
    coreGroup.add(link);
    pulseMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    pulseMesh=new THREE.Mesh(new THREE.TorusGeometry(.9,.03,12,90),pulseMat);
    coreGroup.add(pulseMesh);
    scene.add(coreGroup);
  }
  function e(n){return(Math.random()-.5)*n}

  function makeStars(){
    const P=(count,inner,size,op,colorHex)=>{
      const arr=new Float32Array(count*3);
      for(let i=0;i<count;i++){
        const r=inner+Math.random()*34,th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
        arr[i*3]=r*Math.sin(ph)*Math.cos(th);arr[i*3+1]=r*Math.sin(ph)*Math.sin(th);arr[i*3+2]=r*Math.cos(ph)-4;
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
      const m=new THREE.PointsMaterial({size,sizeAttenuation:true,map:texCircle(255,255,255),transparent:true,opacity:op,color:colorHex,depthWrite:false,blending:THREE.AdditiveBlending});
      return new THREE.Points(g,m);
    };
    stars=P(650,16,1.7,.85,0xbcd8ff);
    bright=P(110,10,3.4,1,0xffffff);
    stars.rotation.set(0,0,.35);bright.rotation.set(0,0,.5);
    scene.add(stars,bright);
  }
  function makeNebulae(){
    const tex=texNebula();
    const spec=[
      {x:-13,y:4,z:-14,sc:22,op:.5,rot:0.4},
      {x:12,y:-5,z:-16,sc:27,op:.42,rot:-0.7},
      {x:0,y:-9,z:-20,sc:30,op:.3,rot:.2}
    ];
    for(const s of spec){
      const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0x5f7ac9,transparent:true,opacity:s.op,blending:THREE.AdditiveBlending,depthWrite:false,rotation:s.rot}));
      m.position.set(s.x,s.y,s.z);m.scale.set(s.sc,s.sc,1);
      nebulas.push(m);scene.add(m);
    }
  }

  function accentOf(n){
    const card=document.querySelector('.tc'+n);
    if(card){const v=getComputedStyle(card).getPropertyValue('--ac');const m=/^#?([0-9a-f]{6})$/i.exec((v||'').trim());if(m)return new THREE.Color('#'+m[1]);}
    return null;
  }
  function setMatColor(m,c,o){if(m.color)m.color.copy(c);if(o!=null&&m.opacity!=null)m.opacity=o}
  let started=false;
  function ensure(){if(started)return;started=true;setTimeout(build,140)}
  function focus(n){
    focusN=n||0;
    const ac=accentOf(n);
    tgt=ac||new THREE.Color(n?_DEF.clone().lerp(new THREE.Color('#8866ff'),Math.abs(Math.sin(n*7.3))):_DEF.clone());
    if(!cur)cur=tgt.clone();
    ensure();
  }
  function pulseFx(){ensure();pulse=Math.max(pulse,0)+1}
  function release(n){
    if(n&&document.getElementById('tb'+n)&&document.getElementById('tb'+n).classList.contains('open'))return;
    let any=false;
    for(let i=1;i<=13;i++){const tb=document.getElementById('tb'+i);if(tb&&tb.classList.contains('open')){any=true;break}}
    focus(any?0:0);
    if(!any){focusT=Math.min(focusT,.2)}
  }

  function resize(){
    if(!renderer)return;
    const w=window.innerWidth,h=window.innerHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function build(){
    try{
      canvas=document.createElement('canvas');canvas.id='env3d';canvas.setAttribute('aria-hidden','true');
      document.body.appendChild(canvas);
      renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'default'});
      renderer.setPixelRatio(DPI);renderer.setClearAlpha(0);
      scene=new THREE.Scene();
      camera=new THREE.PerspectiveCamera(55,1,.1,120);camera.position.set(0,0,11);
      makeStars();makeNebulae();makeCore();
      cur=_DEF.clone();tgt=_DEF.clone();
      window.addEventListener('resize',resize);
      window.addEventListener('mousemove',e=>{ptrX=e.clientX/window.innerWidth*2-1;ptrY=e.clientY/window.innerHeight*2-1},{passive:true});
      window.addEventListener('touchmove',e=>{if(e.touches[0]){ptrX=e.touches[0].clientX/window.innerWidth*2-1;ptrY=e.touches[0].clientY/window.innerHeight*2-1}},{passive:true});
      resize();last=performance.now();
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lostPrivate=true},{passive:false});
      canvas.addEventListener('webglcontextrestored',()=>{lostPrivate=false;last=performance.now()});
      if(reduced){render(0,performance.now());}
      else{loop(performance.now());}
    }catch(err){console.warn('[env3d] kurulum başarısız',err)}
  }
  function loop(){
    if(raf)return;
    const step=t=>{
      raf=requestAnimationFrame(step);
      if(document.hidden)return;
      render(performance.now()-last,t);last=performance.now();
    };
    raf=requestAnimationFrame(step);
  }
  function render(dt,now){
    if(!renderer||!scene)return;
    frames++;
    if(lostPrivate)return;
    const s=dt/1000;
    spinT+=s;
    // focus amp
    const want=focusN&&document.getElementById('tb'+focusN)&&document.getElementById('tb'+focusN).classList.contains('open')?1:0;
    focusT+=(want-focusT)*.035;
    if(cur&&tgt)cur.lerp(tgt,.04);
    if(canvas)canvas.style.opacity=.35+.6*focusT;
    if(pulse>0)pulse=Math.max(0,pulse-s*.8);else pulse=0;
    const meta=_META[focusN]||{s:1,c:1};
    spin+=s*.22*meta.s*(.55+.9*focusT);
    px+=(ptrX*1.1-px)*.04;py+=(ptrY*.85-py)*.04;
    camera.position.x=px*1.4;camera.position.y=py*1.1;
    starDrift(stars,.006);starDrift(bright,.01);
    for(const m of nebulas){m.material.opacity=(m.userData&&m.userData.op||.4)*(.45+.8*focusT)}
    if(coreGroup){
      coreGroup.visible=truish(focusT);
      const sc=.55+.45*focusT;
      coreGroup.scale.setScalar(sc);
      coreGroup.rotation.y+=s*.12*meta.s;coreGroup.rotation.x=Math.sin(spinT*.05)*.5+.1*focusT;
      setMatColor(rings[0].material,cur,cur&&(.55*focusT+.1));
      setMatColor(rings[1].material,cur,cur&&(.4*focusT+.08));
      setMatColor(ico.material,cur,cur&&(.38*focusT+.08));
      setMatColor(ico2.material,new THREE.Color(0xffffff),.16*focusT);
      setMatColor(glow.material,cur,cur&&(.5*focusT));
      // nodes orbit + entanglement link
      const pos=link.geometry.attributes.position.array;
      for(let i=0;i<nodes.length;i++){
        const nd=nodes[i];const u=nd.userData;u.a+=s*u.sp*meta.s;
        const x=Math.cos(u.a)*u.r,y=Math.sin(u.a)*u.r*Math.sin(.9),z=Math.sin(u.a)*u.r*Math.cos(.9);
        nd.position.set(x,y,z);
        setMatColor(nd.material,cur,nd.userData.op!=null?nd.userData.op:.75*focusT+.15);
        pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;
      }
      link.geometry.attributes.position.needsUpdate=true;
      setMatColor(link.material,cur,cur&&.55*focusT);
      // pulse ring
      if(pulse>0){
        pulseMat.opacity=.8*pulse;const ps=1+(1-pulse)*3.4;
        pulseMesh.scale.set(ps,ps,ps);
      }else{pulseMat.opacity=0}
    }
    try{renderer.render(scene,camera)}catch(err){}
    if(frames%12===0&&(now-last>800)){fps=frames/(now-last);frames=0;last=now}
  }
  function truish(v){return v>.02}
  function starDrift(g,rate){g.rotation.z+=rate*.6;g.rotation.x+=rate*.3}

  const api={focus,release,pulse:pulseFx,alive:()=>!!renderer&&!lostPrivate};
  Object.assign(window,{QLabEnv3D:api});
  return api;
})();