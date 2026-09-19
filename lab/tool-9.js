/* ══ T9: BLOCH SPHERE (3D) ══ */
let bloch=null;
window._stop3d=window._stop3d||{};
window._stop3d[9]=()=>{if(bloch){if(window.Q3D&&bloch.o){bloch.o.stop();bloch.o=null}bloch.dead=true;bloch=null}};
function thv(){return +document.getElementById('bloch-th').value}
function phv(){return +document.getElementById('bloch-ph').value}
function blochSet(th,ph){
  th=+th;ph=+ph;
  document.getElementById('bloch-th').value=th;
  document.getElementById('bloch-ph').value=ph;
  document.getElementById('bloch-theta').textContent=th+'°';
  document.getElementById('bloch-phi').textContent=ph+'°';
  if(bloch&&!bloch.dead){bloch.th=th;bloch.ph=ph;bloch.update()}
  blochReadout();
}
function blochReadout(){
  const b=bloch&&!bloch.dead?bloch:{th:thv()||90,ph:phv()||0};
  const th=b.th*Math.PI/180,ph=b.ph*Math.PI/180;
  const a=Math.cos(th/2),bb=Math.sin(th/2);
  const x=Math.sin(th)*Math.cos(ph),y=Math.sin(th)*Math.sin(ph),z=Math.cos(th);
  const el=document.getElementById('bloch-readout');
  if(el)el.innerHTML=`|ψ⟩ = ${a.toFixed(3)}·|0⟩ + e<sup>iφ</sup>·${bb.toFixed(3)}·|1⟩<br><b>|α|² = P(|0⟩) = ${(a*a).toFixed(4)}</b> &nbsp; <b>|β|² = P(|1⟩) = ${(bb*bb).toFixed(4)}</b><br>Bloch vektörü: (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`;
}
function blochStart(){if(!bloch||bloch.dead)bloch=new BlochSphere();else bloch.update()}
class BlochSphere{
  constructor(){
    this.th=thv()||90;this.ph=phv()||0;
    this.dead=false;
    this.arrow=null;this.tip=null;
    this.o=window.Q3D?Q3D.mount('bloch-canvas',{cam:[0,0,5.6],fov:45,amb:.75,autoRot:true}):null;
    if(!this.o){this.draw2d();return}
    const g=this.o.g,R=1.6;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R,48,32),Q3D.m(0x06162a,0.24)));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R,36,24),new THREE.MeshBasicMaterial({color:0x00c8f0,wireframe:true,transparent:true,opacity:0.12})));
    g.add(Q3D.ring(R,Q3D.CYAN,72,0.35));
    [0,Math.PI/2,Math.PI,Math.PI*3/2].forEach(a=>{const rp=Q3D.ring(R,0x2a5a80,48,0.16);rp.rotation.x=a;g.add(rp)});
    Q3D.axis(g,2.5);
    g.add(this.dot([1.15,0,0],Q3D.CYAN,'X'));
    g.add(this.dot([0,1.15,0],Q3D.PURPLE,'Y'));
    g.add(this.dot([0,0,1.25],Q3D.GREEN,'|0⟩'));
    g.add(this.dot([0,0,-1.25],Q3D.RED,'|1⟩'));
    this.o.on.update=o=>{if(o.orbitLine){o.orbitLine.rotation.y=o.k*0.25;o.orbitLine.rotation.x=Math.PI/2}if(o.glowS){o.glowS.rotateZ(o.k)}};
    this.update();
  }
  dot(axis,color,label){
    const grp=new THREE.Group();
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.06,16,12),Q3D.m(color,1));
    s.position.set(axis[0],axis[1],axis[2]);grp.add(s);
    const t=Q3D.glow('rgba(0,200,240,0.5)',0.7);t.position.set(axis[0],axis[1],axis[2]);grp.add(t);
    return grp;
  }
  vec(t,p){const th=t*Math.PI/180,ph=p*Math.PI/180;return new THREE.Vector3(Math.sin(th)*Math.cos(ph),Math.sin(th)*Math.sin(ph),Math.cos(th))}
  update(){
    if(!this.o||this.dead)return;
    const g=this.o.g;
    if(this.arrow){g.remove(this.arrow);if(this.arrow.geometry)this.arrow.geometry.dispose()}
    if(this.tip)g.remove(this.tip);
    if(this.o.orbitLine){g.remove(this.o.orbitLine)}
    const dir=this.vec(this.th,this.ph);
    this.arrow=new THREE.ArrowHelper(dir,new THREE.Vector3(0,0,0),1.6,0x00e5ff,0.3,0.17);
    g.add(this.arrow);
    this.tip=Q3D.glow('rgba(0,225,255,0.95)',1.15);
    this.tip.position.copy(dir.clone().multiplyScalar(1.6));
    g.add(this.tip);
    const orb=Q3D.ring(1.78,0x0e3a55,64,0.18);
    orb.rotation.x=Math.PI/2;orb.rotation.y=this.ph*Math.PI/180;
    g.add(orb);this.o.orbitLine=orb;
  }
  draw2d(){
    const c=document.getElementById('bloch-canvas');
    if(!c)return;
    const ctx=c.getContext('2d');
    const w=c.clientWidth||420,h=c.clientHeight||300;
    ctx.clearRect(0,0,w,h);
    const R=Math.min(w,h)*0.34,cx=w/2,cy=h/2;
    ctx.strokeStyle='rgba(0,200,240,.35)';ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(0,200,240,.18)';ctx.beginPath();ctx.ellipse(cx,cy,R,R*0.36,0,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(0,200,240,.35)';ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.stroke();
    const a=this.th*Math.PI/180,p=this.ph*Math.PI/180;
    const ex=cx+R*Math.sin(a)*Math.cos(p),ey=cy-R*Math.sin(a)*Math.sin(p)*0.36,ez=cy-R*Math.cos(a);
    ctx.strokeStyle='#00e5ff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.strokeStyle='rgba(0,200,240,.5)';ctx.beginPath();ctx.arc(ex,ey,5,0,7);ctx.stroke();
  }
}