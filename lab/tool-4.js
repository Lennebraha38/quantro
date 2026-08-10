/* ══ T4: BB84 ══ */
function qlog(m,t=''){const l=document.getElementById('ql');const p=document.createElement('p');p.className=t;p.textContent=m;l.prepend(p)}
function rstBB84(){['ab','aba','bb','br'].forEach(id=>document.getElementById(id).innerHTML='');['ak','bk'].forEach(id=>document.getElementById(id).textContent='—');document.getElementById('ql').innerHTML='';document.getElementById('sf').style.width='0%';document.getElementById('sp').textContent='0%'}
async function rBB84(){
  rstBB84();const N=16;const eve=document.getElementById('eve').checked;
  let qbits=null;
  try{qbits=await Qrng.bytes(16);}catch(e){qbits=null}
  const qb=i=>qbits?(qbits[i]&1):Math.round(Math.random());
  const qbase=i=>qbits?((qbits[i]>>1)&1):(Math.random()>.5?1:0);
  const aB=Array.from({length:N},(_,i)=>qb(i));
  const aBas=Array.from({length:N},(_,i)=>qbase(i));
  const evBas=eve?Array.from({length:N},(_,i)=>qbase(N+i)):null;
  const bBas=Array.from({length:N},(_,i)=>qbase((2*N+i)%16));
  const bRes=aB.map((b,i)=>eve&&evBas[i]!==aBas[i]?Math.round(Math.random()):bBas[i]===aBas[i]?b:Math.round(Math.random()));
  const mi=aBas.map((b,i)=>b===bBas[i]?i:-1).filter(i=>i>=0);
  const ak=mi.map(i=>aB[i]).join('');const bk=mi.map(i=>bRes[i]).join('');
  let errs=0;mi.forEach(i=>{if(aB[i]!==bRes[i])errs++});
  const sec=eve?Math.max(0,Math.round((1-errs/Math.max(mi.length,1)*2)*100)):100;
  const mkBits=(arr,cls)=>arr.map(b=>`<div class="qbit ${cls}">${b}</div>`).join('');
  document.getElementById('ab').innerHTML=mkBits(aB,'sent');
  document.getElementById('aba').innerHTML=mkBits(aBas,'sent');
  document.getElementById('bb').innerHTML=bBas.map((b,i)=>`<div class="qbit ${aBas[i]===b?'match':'mismatch'}">${b}</div>`).join('');
  document.getElementById('br').innerHTML=bRes.map((b,i)=>`<div class="qbit ${mi.includes(i)?'match':''}">${b}</div>`).join('');
  document.getElementById('ak').textContent=ak||t('t4.nomatch');
  document.getElementById('bk').textContent=bk||t('t4.nomatch');
  setTimeout(()=>{
    const sf=document.getElementById('sf');sf.style.width=sec+'%';
    sf.style.background=sec>70?'var(--green)':sec>40?'var(--cyan)':'var(--red)';
    const sp=document.getElementById('sp');sp.textContent=sec+'%';sp.style.color=sec>70?'var(--green)':sec>40?'var(--cyan)':'var(--red)';
  },100);
  qlog(t('t4.log.start'));
  qlog(t('t4.log.sent',N),'ok');
  if(eve)qlog(t('t4.log.eve'),'warn');
  qlog(t('t4.log.match',mi.length,N),'ok');
  if(errs>0)qlog(t('t4.log.err',errs),'err');
  else qlog(t('t4.log.safe'),'ok');
  qlog(t('t4.log.key',ak.length),'ok');
}
