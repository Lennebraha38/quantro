let bloch=null;
function thv(){return +document.getElementById('bloch-th').value}
function phv(){return +document.getElementById('bloch-ph').value}
function blochSet(th,ph){
  th=+th;ph=+ph;
  document.getElementById('bloch-th').value=th;
  document.getElementById('bloch-ph').value=ph;
  document.getElementById('bloch-theta').textContent=th+'°';
  document.getElementById('bloch-phi').textContent=ph+'°';
  if(bloch){bloch.th=th;bloch.ph=ph;bloch.draw()}
  blochReadout();
}
function blochReadout(){
  const th=bloch.th*Math.PI/180,ph=bloch.ph*Math.PI/180;
  const a=Math.cos(th/2),b=Math.sin(th/2);
  const x=Math.sin(th)*Math.cos(ph),y=Math.sin(th)*Math.sin(ph),z=Math.cos(th);
  const el=document.getElementById('bloch-readout');
  el.innerHTML=`|ψ⟩ = ${a.toFixed(3)}·|0⟩ + e<sup>iφ</sup>·${b.toFixed(3)}·|1⟩<br><b>|α|² = P(|0⟩) = ${(a*a).toFixed(4)}</b> &nbsp; <b>|β|² = P(|1⟩) = ${(b*b).toFixed(4)}</b><br>Bloch vektörü: (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`;
}
function blochStart(){
  if(bloch){bloch.draw();return}
  bloch=new BlochSphere();
}
class BlochSphere{
  constructor(){
    this.c=document.getElementById('bloch-canvas');
    this.ctx=this.c.getContext('2d');
    this.th=thv()||90;this.ph=phv()||0;
    this.yaw=-0.7;this.pitch=0.42;
    this.drag=false;this.px=0;this.py=0;
    const c=this.c;
    c.addEventListener('mousedown',e=>{this.drag=true;this.px=e.clientX;this.py=e.clientY});
    c.addEventListener('mousemove',e=>this.onDrag(e.clientX,e.clientY));
    c.addEventListener('mouseup',()=>this.drag=false);
    c.addEventListener('mouseleave',()=>this.drag=false);
    c.addEventListener('touchstart',e=>{e.preventDefault();this.drag=true;this.px=e.touches[0].clientX;this.py=e.touches[0].clientY},{passive:false});
    c.addEventListener('touchmove',e=>{e.preventDefault();this.onDrag(e.touches[0].clientX,e.touches[0].clientY)},{passive:false});
    c.addEventListener('touchend',()=>this.drag=false);
    this.draw();
  }
  onDrag(x,y){
    if(!this.drag)return;
    this.yaw+=(x-this.px)*0.008;
    this.pitch+=(y-this.py)*0.008;
    this.pitch=Math.max(-1.4,Math.min(1.4,this.pitch));
    this.px=x;this.py=y;
    this.draw();
  }
  vec(th,ph){
    const t=th*Math.PI/180,p=ph*Math.PI/180;
    return [Math.sin(t)*Math.cos(p),Math.sin(t)*Math.sin(p),Math.cos(t)];
  }
  rot(p){
    const [x,y,z]=p;
    const c1=Math.cos(this.yaw),s1=Math.sin(this.yaw);
    const x1=c1*x+s1*z,z1=-s1*x+c1*z;
    const c2=Math.cos(this.pitch),s2=Math.sin(this.pitch);
    const y2=c2*y-s2*z1,z2=s2*y+c2*z1;
    return [x1,y2,z2];
  }
  s2(p){const [x,y]=this.rot(p);return [this.cx+this.R*x,this.cy-this.R*y]}
  draw(){
    const c=this.c,ctx=this.ctx;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const cw=c.clientWidth||520,ch=c.clientHeight||320;
    c.width=cw*dpr;c.height=ch*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,cw,ch);
    const R=Math.min(cw,ch)*0.34,cx=cw/2,cy=ch/2;
    this.R=R;this.cx=cx;this.cy=cy;
    const arc=(pts,style,lw)=>{
      ctx.strokeStyle=style;ctx.lineWidth=lw||1;
      ctx.beginPath();
      for(let i=0;i<pts.length;i++){
        const [x,y]=this.s2(pts[i]);
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();
    };
    ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.fillStyle='rgba(2,8,16,.65)';ctx.fill();
    for(let m=0;m<6;m++){
      const pts=[];for(let i=0;i<=36;i++)pts.push(this.vec(i*5,m*30));
      arc(pts,'rgba(0,200,240,.16)');
    }
    for(let m=1;m<6;m++){
      const pts=[];for(let i=0;i<=36;i++)pts.push(this.vec(m*30,i*10));
      arc(pts,'rgba(0,200,240,.13)');
    }
    arc([...Array(37)].map((_,i)=>this.vec(90,i*10)),'rgba(0,200,240,.35)',1.3);
    this.axis([1,0,0],'X',[0,200,240]);
    this.axis([0,1,0],'Y',[160,96,255]);
    this.axis([0,0,1],'|0⟩',[0,240,160]);
    this.axis([0,0,-1],'|1⟩',[255,68,102]);
    const [ex,ey,ez]=this.s2(this.vec(this.th,this.ph));
    const [px,py]=this.s2(this.vec(90,this.ph));
    ctx.strokeStyle='rgba(0,200,240,.28)';ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(px,py);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#00c8f0';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();
    const ang=Math.atan2(ey-cy,ex-cx),ah=9;
    ctx.fillStyle='#00c8f0';
    ctx.beginPath();
    ctx.moveTo(ex+ah*Math.cos(ang),ey+ah*Math.sin(ang));
    ctx.lineTo(ex+ah*.6*Math.cos(ang+2.5),ey+ah*.6*Math.sin(ang+2.5));
    ctx.lineTo(ex+ah*.6*Math.cos(ang-2.5),ey+ah*.6*Math.sin(ang-2.5));
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,200,240,.5)';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(ex,ey,6,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);ctx.fill();
  }
  axis(v,label,rgb){
    const ctx=this.ctx;
    const [ax,ay]=this.s2(v);
    ctx.strokeStyle='rgba(232,237,245,.4)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.lineTo(ax,ay);ctx.stroke();
    ctx.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',.9)';
    ctx.font='600 12px Consolas,monospace';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const off=12;
    ctx.fillText(label,ax+Math.sign(ax-this.cx)*off,ay+Math.sign(ay-this.cy)*off);
  }
}
