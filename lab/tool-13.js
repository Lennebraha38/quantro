/* ══ T13: QUANTUM WALK ══ */
var qw={cv:null,cx:null,W:860,H:340,N:60,p:0.5,observe:false,
        aUp:null,aDn:null,cl:null,step:0,steps:60,run:false,raf:null,t0:0};
function qwGet(id){return document.getElementById(id)}
function qwStart(){
  qw.cv=qwGet('qw-canvas');
  if(!qw.cv)return;
  if(qw.cv.width!==qw.W){qw.cv.width=qw.W;qw.cv.height=qw.H}
  qw.cx=qw.cv.getContext('2d');
  qwRead();
  qwInit();
  qwDraw();
}
function qwRead(){
  const s=qwGet('qw-steps'),b=qwGet('qw-bias'),o=qwGet('qw-observe');
  if(!s||!b||!o)return;
  qw.steps=Math.max(5,Math.min(160,(+s.value)||60));
  qw.p=Math.min(0.9,Math.max(0.1,((+b.value)||50)/100));
  qw.observe=o.checked;
  qwGet('qw-sv').textContent=qw.steps;
  qwGet('qw-bv').textContent=qw.p.toFixed(2);
}
function qwInit(){
  const N=qw.steps;
  qw.aUp=new Array(2*N+1).fill(0);
  qw.aDn=new Array(2*N+1).fill(0);
  qw.cl =new Array(2*N+1).fill(0);
  qw.aUp[N]=1;
  qw.cl[N]=1;
  qw.step=0;
  qw.run=false;
}
function qwStep(){
  const N=qw.steps;
  const up=Math.sqrt(qw.p),dn=Math.sqrt(1-qw.p);
  const ncl=new Array(2*N+1).fill(0);
  for(let i=0;i<=2*N;i++){
    if(qw.cl[i]<=0)continue;
    ncl[i+1]+=qw.cl[i]*qw.p;
    ncl[i-1]+=qw.cl[i]*(1-qw.p);
  }
  qw.cl=ncl;
  if(qw.observe){
    for(let i=0;i<=2*N;i++){qw.aUp[i]=Math.sqrt(qw.cl[i]);qw.aDn[i]=0;}
  }else{
    const nu=new Array(2*N+1).fill(0),nd=new Array(2*N+1).fill(0);
    for(let i=0;i<=2*N;i++){
      const u=qw.aUp[i],d=qw.aDn[i];
      const ru=up*u+dn*d;
      const rd=dn*u-up*d;
      nu[i+1]+=ru;nd[i-1]+=rd;
    }
    qw.aUp=nu;qw.aDn=nd;
  }
  qw.step++;
}
function qwProb(aUp,aDn,N){
  const p=new Array(2*N+1).fill(0);
  for(let i=0;i<=2*N;i++)p[i]=aUp[i]*aUp[i]+aDn[i]*aDn[i];
  return p;
}
function qwSigma(arr,N){
  let tot=0;for(let i=0;i<=2*N;i++)tot+=arr[i];
  if(tot<=0)return 0;
  let m=0;for(let i=0;i<=2*N;i++)m+=(i-N)*arr[i];
  m/=tot;
  let v=0;for(let i=0;i<=2*N;i++)v+=((i-N)-m)*((i-N)-m)*arr[i];
  return Math.sqrt(v/tot);
}
function qwDraw(){
  const cx=qw.cx;if(!cx)return;
  const N=qw.steps,W=qw.W,H=qw.H;
  cx.clearRect(0,0,W,H);
  cx.fillStyle='#020810';cx.fillRect(0,0,W,H);
  const top=H*0.09,bottom=H*0.8;
  const barW=Math.max(1,Math.floor(W/(2*N+1)));
  cx.strokeStyle='rgba(0,200,240,.05)';
  cx.lineWidth=1;
  for(let x=0;x<=W;x+=43){cx.beginPath();cx.moveTo(x,top);cx.lineTo(x,bottom);cx.stroke();}
  const qp=qwProb(qw.aUp,qw.aDn,N);
  let qmax=0;for(let i=0;i<=2*N;i++)if(qp[i]>qmax)qmax=qp[i];
  for(let i=0;i<=2*N;i++){
    if(qw.cl[i]<=0)continue;
    const h=(qw.cl[i]/qmax)*(bottom-top);
    cx.fillStyle='rgba(160,96,255,.45)';
    cx.fillRect(i*barW,bottom-h,barW,h);
  }
  if(qmax>0)for(let i=0;i<=2*N;i++){
    if(qp[i]<=0)continue;
    const h=(qp[i]/qmax)*(bottom-top);
    cx.fillStyle='rgba(0,200,240,.85)';
    cx.fillRect(i*barW,bottom-h,barW,h);
  }
  cx.strokeStyle='rgba(255,255,255,.08)';
  cx.beginPath();cx.moveTo(N*barW+barW/2,top);cx.lineTo(N*barW+barW/2,bottom);cx.stroke();
  cx.font='10px JetBrains Mono,monospace';
  cx.fillStyle='rgba(0,200,240,.85)';cx.fillText('■ Kuantum',10,18);
  cx.fillStyle='rgba(160,96,255,.85)';cx.fillText('■ Klasik',100,18);
  cx.fillStyle='rgba(255,255,255,.28)';
  cx.fillText('adım '+qw.step+'/'+qw.steps,W-92,18);
  const sQ=qwSigma(qp,N),sC=qwSigma(qw.cl,N);
  cx.fillStyle='rgba(0,200,240,.75)';
  cx.fillText('σ_Q='+sQ.toFixed(2)+'  (teorik ≈'+(0.5*qw.step).toFixed(1)+')',10,H-22);
  cx.fillStyle='rgba(160,96,255,.75)';
  cx.fillText('σ_C='+sC.toFixed(2)+'  (teorik ≈'+Math.sqrt(qw.step*4*qw.p*(1-qw.p)).toFixed(1)+')',248,H-22);
}
function qwTick(ms){
  if(!qw.run)return;
  if(ms-qw.t0>=140){
    qw.t0=ms;
    if(qw.step<qw.steps){qwStep();qwDraw();}
    else{qw.run=false;return;}
  }
  qw.raf=requestAnimationFrame(qwTick);
}
function qwRun(){
  qwRead();
  if(qw.run)return;
  if(qw.step>=qw.steps){qwInit();}
  qw.run=true;
  qw.t0=performance.now();
  qw.raf=requestAnimationFrame(qwTick);
}
function qwReset(){
  qw.run=false;
  qwRead();
  qwInit();
  qwDraw();
}
function qwSet(){qwRead();qwDraw();}
