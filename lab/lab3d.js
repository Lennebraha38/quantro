/* ══ Q3D — paylaşılan Three.js sahne motoru ══
   Tüm lab araçlarının 3D görselleri ortak katman üzerinden kurulur:
   tek WebGLRenderer, tekraf döngüsü, sürükle-döndür, otomatik dönüş,
   yıldız alanı + glow sprite + renk materyalleri. Araç kapatılınca
   tog() → Q3D.stop() ile GPU sıfırlanır. */
window.Q3D=(()=>{
  const reg=new Map();
  const CYAN=0x00c8f0,PURPLE=0x5020a0,GREEN=0x00f0a0,RED=0xff4466,GOLD=0xffaa33;
  function mount(id,opts){
    opts=opts||{};
    const cv=document.getElementById(id);
    if(!cv||!window.THREE)return null;
    const host=cv.parentElement||cv;
    let W=cv.clientWidth||opts.w||host.clientWidth||480;
    let H=cv.clientHeight||opts.h||host.clientHeight||300;
    let rnd;
    try{rnd=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,powerPreference:'low-power',preserveDrawingBuffer:true})}catch(e){return null}
    rnd.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    rnd.setSize(W,H,false);
    const sc=new THREE.Scene();
    if(opts.fog!==false)sc.fog=new THREE.FogExp2(0x020810,opts.fogExp||0.03);
    const ca=new THREE.PerspectiveCamera(opts.fov||50,W/H,0.1,1000);
    ca.position.set(...(opts.cam||[0,1.5,5.4]));
    ca.lookAt(...(opts.look||[0,0,0]));
    sc.add(new THREE.AmbientLight(0x8a9cc8,opts.amb||0.6));
    const l1=new THREE.DirectionalLight(0x00c8f0,opts.l1||0.85);l1.position.set(4,5,6);sc.add(l1);
    const l2=new THREE.DirectionalLight(0x6040c0,opts.l2||0.55);l2.position.set(-5,-3,4);sc.add(l2);
    const g=new THREE.Group();sc.add(g);
    const o={id,cv,host,rnd,sc,ca,g,on:opts.on||{},autoRot:opts.autoRot!==false,done:false,k:0,raw:opts.raw||{}};
    const st={down:false,sx:0,sy:0};
    const dw=e=>{if(e.button!==undefined&&e.button!==0)return;st.down=true;st.sx=e.clientX;st.sy=e.clientY;cv.style.cursor='grabbing'};
    const mv=e=>{if(!st.down)return;const dx=e.clientX-st.sx,dy=e.clientY-st.sy;st.sx=e.clientX;st.sy=e.clientY;g.rotation.y+=dx*0.006;g.rotation.x=Math.max(-1.2,Math.min(1.2,g.rotation.x+dy*0.006))};
    const up=()=>{st.down=false;cv.style.cursor='grab'};
    cv.style.cursor='grab';
    cv.addEventListener('mousedown',dw,{passive:true});
    window.addEventListener('mousemove',mv,{passive:true});
    window.addEventListener('mouseup',up,{passive:true});
    o.st=st;
    o.resize=()=>{const w=cv.clientWidth||host.clientWidth||W,h=cv.clientHeight||host.clientHeight||H;rnd.setSize(w,h,false);ca.aspect=w/h;ca.updateProjectionMatrix()};
    window.addEventListener('resize',o.resize);
    let raf=0;
    const loop=()=>{if(o.done)return;raf=requestAnimationFrame(loop);o.k+=0.004;if(o.autoRot&&!st.down)g.rotation.y+=0.003;if(o.on.update)o.on.update(o);rnd.render(sc,ca)};
    raf=requestAnimationFrame(loop);
    o.stop=()=>{o.done=true;cancelAnimationFrame(raf);window.removeEventListener('resize',o.resize);window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);if(reg.get(id)===o)reg.delete(id);try{sc.traverse(n=>{if(n.material&&n.material.map)n.material.map.dispose();if(n.geometry)n.geometry.dispose()});rnd.dispose()}catch(e){}};
    reg.set(id,o);
    return o;
  }
  function stop(id){const o=reg.get(id);if(o)o.stop()}
  function stopAll(){Array.from(reg.values()).forEach(o=>o.stop());reg.clear()}
  function stars(o,n,rad,size,op){
    if(!o)return null;
    const N=n||420,geo=new THREE.BufferGeometry(),pos=new Float32Array(N*3),col=new Float32Array(N*3),c=new THREE.Color();
    for(let i=0;i<N;i++){
      const r=rad||7+Math.random()*7,th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.cos(ph)*0.7;pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
      c.setHSL(0.52+Math.random()*0.08,0.85,0.3+Math.random()*0.4);
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const m=new THREE.PointsMaterial({size:size||0.09,vertexColors:true,transparent:true,opacity:op!==undefined?op:0.85,sizeAttenuation:true});
    const p=new THREE.Points(geo,m);o.sc.add(p);return p;
  }
  function glow(cssColor,size){
    const cnv=document.createElement('canvas');cnv.width=cnv.height=128;
    const g=cnv.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.22,cssColor);gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr;g.fillRect(0,0,128,128);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cnv),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    s.scale.set(size||2,size||2,1);return s;
  }
  function ring(radius,color,seg,op){
    const g=new THREE.BufferGeometry();
    const p=[],a=new THREE.Vector3();
    for(let i=0;i<=(seg||64);i++){a.setFromSpherical(new THREE.Spherical(radius,i/(seg||64)*Math.PI*2,Math.PI/2));p.push(a.clone())}
    g.setFromPoints(p);
    return new THREE.Line(g,new THREE.LineBasicMaterial({color:color||CYAN,transparent:true,opacity:op!==undefined?op:0.5}));
  }
  function axis(g,len){
    const L=len||2;
    [[1,0,0,CYAN],[0,1,0,PURPLE],[0,0,1,GREEN]].forEach(([x,y,z,c])=>{
      const bg=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-x*L/4,-y*L/4,-z*L/4),new THREE.Vector3(x*L,y*L,z*L)]);
      g.add(new THREE.Line(bg,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:0.45})));
    });
  }
  function m(color,op){return new THREE.MeshBasicMaterial({color:color,transparent:op!==undefined,opacity:op!==undefined?op:1})}
  return {mount,stop,stopAll,stars,glow,ring,axis,m,CYAN,PURPLE,GREEN,RED,GOLD};
})();