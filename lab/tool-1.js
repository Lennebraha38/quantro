/* ══ T1: QRNG ══ */
let qh=[];
function qRNG(mn,mx){const b=new Uint32Array(4);crypto.getRandomValues(b);let v=0;for(let i=0;i<4;i++)v^=b[i];return mn+Math.abs(v)%(mx-mn+1)}
function qStat(key,cls){
  window.lastQStat={k:key,c:cls||'var(--muted)'};
  const el=document.getElementById('qstat');
  if(el){el.textContent=t(key);el.style.color=window.lastQStat.c}
}
function qSource(){const s=document.getElementById('qsrc');return s?s.value:'quantum'}
async function qBytes(n){return {bytes:await Qrng.bytes(n),label:Qrng.label()}}
async function qQuantum(mn,mx){
  const span=mx-mn+1;
  const o=await qBytes(6);
  if(!o.bytes.length)return {v:null,label:''};
  let b=0;for(let k=0;k<6;k++)b=b*256+(o.bytes[k]&255);
  return {v:mn+(b%span),label:o.label};
}
async function genQ(){
  const mn=parseInt(document.getElementById('qmin').value)||1;
  const mx=parseInt(document.getElementById('qmax').value)||1000000;
  if(mn>=mx)return;
  const el=document.getElementById('qn');
  let c=0;const iv=setInterval(()=>{el.textContent=qRNG(mn,mx).toLocaleString('tr-TR');if(++c>10)clearInterval(iv)},60);
  await new Promise(r=>setTimeout(r,720));
  let f=null;
  if(qSource()==='quantum'){
    const o=await qQuantum(mn,mx);
    if(o.v!==null){f=o.v;qStat(o.label||'stat.none',o.label?'var(--green)':'var(--gold)')}
    else qStat('stat.none','var(--gold)');
  }
  if(f===null)f=qRNG(mn,mx);
  el.textContent=f.toLocaleString('tr-TR');
  addQH(f);
}
async function genQS(){
  const mn=parseInt(document.getElementById('qmin').value)||1;
  const mx=parseInt(document.getElementById('qmax').value)||1000000;
  if(mn>=mx)return;
  const quant=qSource()==='quantum';
  for(let i=0;i<10;i++){
    let n;
    if(quant){
      const o=await qQuantum(mn,mx);
      if(o.v!==null){n=o.v;qStat(o.label||'stat.none',o.label?'var(--green)':'var(--gold)')}
      else{n=qRNG(mn,mx);qStat('stat.none','var(--gold)')}
    }else n=qRNG(mn,mx);
    document.getElementById('qn').textContent=n.toLocaleString('tr-TR');
    addQH(n);
  }
}
function addQH(n){qh.unshift(n);if(qh.length>12)qh.pop();document.getElementById('qh').innerHTML=qh.map(x=>`<div class="qhi">${x.toLocaleString('tr-TR')}</div>`).join('')}
function clearQ(){qh=[];document.getElementById('qh').innerHTML='';document.getElementById('qn').textContent='—'}
const CHI_CRIT=[null,3.841,5.991,7.815,9.488,11.070,12.592,14.067,15.507,16.919,18.307,19.675,21.026,22.362,23.685,24.996,26.296,27.587,28.869,30.144,31.410,32.671,33.924,35.172,36.415,37.652,38.885,40.113,41.337,42.557,43.773,44.985];
function chiToggle(){const p=document.getElementById('qstats');p.hidden=!p.hidden;if(!p.hidden&&document.getElementById('qbars').innerHTML==='')chiRun()}
async function chiRun(){
  const el=document.getElementById('qstatstext');
  el.textContent=t('chi.busy');
  const o=await qBytes(1024);
  const K=16;
  const counts=new Array(K).fill(0);
  o.bytes.slice(0,1024).forEach(b=>counts[(b&255)>>4]++);
  const N=o.bytes.length,exp=N/K;
  let chi=0;counts.forEach(c=>chi+=(c-exp)*(c-exp)/exp);
  const crit=CHI_CRIT[K-1],pass=chi<crit;
  let h='';
  for(let i=0;i<K;i++){const r=counts[i]/exp;const hgt=Math.max(3,Math.min(120,Math.round(r*60)));h+=`<div class="qbar"><div class="qbar-f" style="height:${hgt}px"></div><span class="qbar-exp"></span><div class="qbar-l">${i*16}–${i*16+15}</div><div class="qbar-v">${counts[i]}</div></div>`}
  document.getElementById('qbars').innerHTML=h;
  el.innerHTML=(o.label?`<span style="color:${o.label?'var(--green)':'var(--gold)'}">${t(o.label)}</span><br>`:'')+`N=${N}, kova(K)=${K}, beklenen=${exp}, χ²=${chi.toFixed(2)} (serbestlik=${K-1}, kritik≈${crit})<br><b style="color:${pass?'var(--green)':'var(--red)'}">${pass?t('chi.ok'):t('chi.fail')}</b>`;
}
function qInit(){
  Qrng.bytes(2).then(o=>{
    const lbl=Qrng.label();
    qStat(lbl&&lbl!=='stat.none'?'stat.init.ok':'stat.init.fail',lbl&&lbl!=='stat.none'?'var(--green)':'var(--gold)');
  }).catch(()=>qStat('stat.init.fail','var(--gold)'));
}
(function(){
  const qn=document.getElementById('qn');
  if(qn){qn.title=t('copy.hint');qn.onclick=()=>{const v=qn.textContent.trim();if(v&&v!=='—')QLab.copy(v)}}
})();
