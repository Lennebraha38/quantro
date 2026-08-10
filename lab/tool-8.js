/* ══ T8: TELEPORTATION ══ */
function teleReset(){
  const log=document.getElementById('tele-log');
  log.innerHTML=`<div class="tele-line" style="color:var(--muted)">${t('t8.ready')}</div>`;
}
async function teleRun(){
  const log=document.getElementById('tele-log');
  log.innerHTML='';
  const L=[];
  L.push(`<b>① Bell çifti</b> |β00⟩ = (|00⟩+|11⟩)/√2 — Alice'in q1'i ve Bob'un q2'si dolaşık`);
  L.push(`<b>② Alice'in kübiti</b> |ψ⟩ = √0.7·|0⟩ + √0.3·|1⟩`);
  L.push(`<b>③ Alice</b> CNOT(q0→q1) ve H(q0) uygular → q0 dolaşıklığa dahil`);
  let bits=null;
  try{const o=await qBytes(2);bits=[o.bytes[0]&1,o.bytes[1]&1];}catch(e){bits=[qRNG(0,1),qRNG(0,1)]}
  const m0=bits[0],m1=bits[1];
  L.push(`<b>④ Bell ölçümü</b> (gerçek kuantum rastgele): ${m0}${m1}`);
  const corr=(m0&&m1)?'ZX':m1?'X':m0?'Z':'I';
  L.push(`<b>⑤ Bob</b> düzeltme: ${corr==='I'?'gerekmedi (I)':corr}`);
  const qc=new Quantro.QuantumCircuit(3);
  qc.ry(2*Math.acos(Math.sqrt(0.7)),0);
  qc.h(1);qc.cx(1,2);qc.cx(0,1);qc.h(0);
  qc.cx(1,2);qc.cz(0,2);
  const counts=await Quantro.sampleDistributionQ(qc,400);
  let one=0,tot=0;
  for(const k in counts){tot+=counts[k];if((parseInt(k,10)&1)===1)one+=counts[k]}
  const obs=(one/tot).toFixed(3);
  L.push(`<b>⑥ Bob'un kübiti ölçüldü</b> (400 atış): P(|1⟩) = <b>${obs}</b> — beklenen 0.300`);
  const ok=parseFloat(obs)>=0.25&&parseFloat(obs)<=0.35;
  L.push(`<span class="${ok?'ok':''}">${ok?'✓ Işınlanma doğrulandı — |ψ⟩ Bob\'ta birebir oluştu!':'≈ Beklenen aralıkta değil — tekrar dene'}</span>`);
  let i=0;
  const iv=setInterval(()=>{
    if(i>=L.length){clearInterval(iv);return}
    const d=document.createElement('div');d.className='tele-line';d.innerHTML=L[i++];log.appendChild(d);log.scrollTop=log.scrollHeight;
  },300);
}
