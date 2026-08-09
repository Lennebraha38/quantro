/* ══ T3: UNIVERSE ══ */
function uU(){
  const H0=parseFloat(document.getElementById('h0').value);
  const Om=parseFloat(document.getElementById('om').value);
  const Ol=parseFloat(document.getElementById('ol').value);
  const Or=parseFloat(document.getElementById('orr').value);
  document.getElementById('h0v').textContent=H0.toFixed(1)+' km/s/Mpc';
  document.getElementById('omv').textContent=Om.toFixed(3);
  document.getElementById('olv').textContent=Ol.toFixed(3);
  document.getElementById('orv').textContent=Or.toFixed(5);
  const H0s=H0*1000/3.0857e22;
  const tH=(1/H0s)/3.156e16;
  const H0g=H0s*3.156e16;
  let age=0;
  for(let i=1;i<=8000;i++){const a=i/8000;const E2=Or/(a*a)+Om/a+Ol*a*a;if(E2>0)age+=1/(Math.sqrt(E2)*8000)}
  age/=H0g;
  const tot=Om+Ol+Or;
  const geo=Math.abs(tot-1)<0.05?t('t3.geo.flat'):tot>1?t('t3.geo.closed'):t('t3.geo.open');
  document.getElementById('ua').innerHTML=age.toFixed(2)+'<span> Gyr</span>';
  document.getElementById('ht').textContent=tH.toFixed(2)+' Gyr';
  document.getElementById('geo').textContent=geo;
  document.getElementById('nowt').textContent=age.toFixed(1)+' Gyr';
}
function rU(){document.getElementById('h0').value=67.4;document.getElementById('om').value=0.315;document.getElementById('ol').value=0.685;document.getElementById('orr').value=0.00009;uU()}
uU();
