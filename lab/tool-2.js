/* ══ T2: CIRCUIT ══ */
let circ=[[],[]];
function ag(g,q){if(g==='CNOT'){circ[0].push({g:'CNOT'});rend();return}circ[q].push({g});rend()}
function rend(){
  for(let q=0;q<2;q++){
    document.getElementById('l'+q).innerHTML=circ[q].map(g=>`<div class="gel ${g.g}" onclick="rmG('${g.g}',${q})">${g.g}</div>`).join('');
    if(q===1&&circ[0].some(g=>g.g==='CNOT'))document.getElementById('l1').innerHTML+=`<div class="gel CNOT" style="border-style:dashed">⊕</div>`;
  }
  document.getElementById('cr').style.display='none';
}
function rmG(g,q){const i=circ[q].findIndex(x=>x.g===g);if(i>-1)circ[q].splice(i,1);rend()}
function rc(){circ=[[],[]];rend()}
async function mc(){
  const qc = new Quantro.QuantumCircuit(2);
  circ[0].forEach(g=>{if(g.g==='H')qc.h(0);else if(g.g==='X')qc.x(0);else if(g.g==='Z')qc.z(0);else if(g.g==='CNOT')qc.cx(0,1)});
  circ[1].forEach(g=>{if(g.g==='H')qc.h(1);else if(g.g==='X')qc.x(1);else if(g.g==='Z')qc.z(1)});
  const btn=document.getElementById('tb2');
  if(btn)btn.setAttribute('data-busy','');
  const counts=await Quantro.sampleDistributionQ(qc,1024);
  if(btn)btn.removeAttribute('data-busy');
  const slots=[0,0,0,0];
  for(const k in counts)slots[k]=counts[k];
  const mx=Math.max(...slots);
  const probs=qc.probabilities();
  const total=slots.reduce((a,b)=>a+b,0)||1;
  const states=['|00⟩','|01⟩','|10⟩','|11⟩'];
  document.getElementById('crb').innerHTML=states.map((l,i)=>{
    const mh=mx>0?Math.round(slots[i]/mx*60):3;
    const eh=Math.max(2,Math.round(probs[i]*60));
    return `<div class="crb-w"><div class="crb-val">${slots[i]}</div><div class="crb-track"><div class="crb ${slots[i]===mx&&slots[i]>0?'active':''}" style="height:${mh}px"></div><span class="crb-exp" style="height:${eh}px"></span></div><div class="crb-lbl">${l}</div><div class="crb-pct">${(probs[i]*100).toFixed(1)}%</div></div>`;
  }).join('');
  const ex=document.getElementById('crx');
  if(ex)ex.innerHTML=`${t('t2.exact')}: ${states.map((l,i)=>
    `<span class="crx-item">${l} <b style="color:var(--cyan)">${(probs[i]*100).toFixed(1)}%</b></span>`
  ).join('<span class="crx-sep">·</span>')}`;
  document.getElementById('cr').style.display='block';
}
function bellDemo(){
  circ=[[],[]];
  circ[0].push({g:'H'});
  circ[0].push({g:'CNOT'});
  rend();
  mc();
}
