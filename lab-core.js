/* ══════════════════════════════════════════════════════════
   QUANTRO LAB — CORE
   Lazy-load çekirdeği: hero, i18n(tr), dil yükleyici,
   tool chunk yükleyici + toggle mantığı.
   ══════════════════════════════════════════════════════════ */

/* ══ UTILS ══ */
const mq=window.matchMedia('(prefers-reduced-motion:reduce)');
window.addEventListener('scroll',()=>document.getElementById('nav').classList.toggle('sc',scrollY>60),{passive:true});

/* ══ CHUNK LOADER ══ */
const _loaded={};
const TOOL_FILES={
  1:['lab/tool-1.js'],8:['lab/tool-8.js'],9:['lab/tool-9.js'],10:['lab/tool-10.js'],11:['lab/tool-11.js'],12:['lab/tool-12.js'],
  2:['quantro.js','lab/tool-2.js'],3:['lab/tool-3.js'],4:['lab/tool-4.js'],5:['lab/tool-5.js'],6:['lab/tool-6.js'],7:['lab/tool-7.js']
};
function loadScripts(urls){
  const pending=urls.filter(u=>!_loaded[u]);
  if(!pending.length)return Promise.resolve();
  return Promise.all(pending.map(u=>new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=u;
    s.onload=()=>{_loaded[u]=true;res();};
    s.onerror=()=>rej(new Error('load '+u));
    document.head.appendChild(s);
  })));
}

let _t1Init=false,_t3Init=false;
/* ══ TOGGLE ══ */
async function tog(n){
  const tb=document.getElementById('tb'+n);
  const tg=document.getElementById('tg'+n);
  const opening=!tb.classList.contains('open');
  const open=tb.classList.toggle('open');
  tg.textContent=open?'×':'+';
  tg.classList.toggle('open',open);
  if(!open)return;
  try{if(window.gtag)gtag('event','lab_tool_open',{tool:n})}catch(e){}
  if(opening){
    tb.setAttribute('data-busy','');
    try{await loadScripts(TOOL_FILES[n]);}catch(e){tb.removeAttribute('data-busy');return}
    tb.removeAttribute('data-busy');
  }
  if(n===1&&!_t1Init){_t1Init=true;qInit();}
  if(n===3&&!_t3Init){_t3Init=true;uU();}
  if(n===5){if(!window.heis3dInit)initHeis3D();uH();}
  if(n===6&&!window.bhInit)initBH();
  if(n===7)uD();
  if(n===9)blochStart();
  if(n===10)catStart();
  if(n===11)tunStart();
  if(n===12)dsStart();
}

/* ══ HERO THREE.JS ══ */
if(window.THREE&&document.getElementById('hero-canvas')){
(function(){
  const canvas=document.getElementById('hero-canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setClearColor(0x020810,1);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.set(0,16,40);
  camera.lookAt(0,0,0);
  scene.fog=new THREE.FogExp2(0x020810,0.018);

  const SEGS=120,SIZE=80;
  const geo=new THREE.PlaneGeometry(SIZE,SIZE,SEGS,SEGS);
  geo.rotateX(-Math.PI/2);
  const vN=geo.attributes.position.array.length/3;
  const cols=new Float32Array(vN*3);
  geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
  const wMat=new THREE.MeshBasicMaterial({vertexColors:true,wireframe:true,transparent:true,opacity:0.45});
  scene.add(new THREE.Mesh(geo,wMat));

  const fGeo=new THREE.PlaneGeometry(SIZE,SIZE,SEGS,SEGS);
  fGeo.rotateX(-Math.PI/2);
  const fMesh=new THREE.Mesh(fGeo,new THREE.MeshBasicMaterial({color:0x001520,transparent:true,opacity:0.6,side:THREE.DoubleSide}));
  fMesh.position.y=-0.05;
  scene.add(fMesh);

  // particles
  const PC=1800,pG=new THREE.BufferGeometry();
  const pP=new Float32Array(PC*3),pC=new Float32Array(PC*3);
  for(let i=0;i<PC;i++){
    const i3=i*3;
    pP[i3]=(Math.random()-.5)*130;pP[i3+1]=Math.random()*55-4;pP[i3+2]=(Math.random()-.5)*130;
    const b=Math.random();
    if(b>.7){pC[i3]=0;pC[i3+1]=.78;pC[i3+2]=.94}
    else if(b>.4){pC[i3]=.28;pC[i3+1]=.15;pC[i3+2]=.7}
    else{pC[i3]=.85;pC[i3+1]=.92;pC[i3+2]=1}
  }
  pG.setAttribute('position',new THREE.BufferAttribute(pP,3));
  pG.setAttribute('color',new THREE.BufferAttribute(pC,3));
  const pts=new THREE.Points(pG,new THREE.PointsMaterial({size:.28,vertexColors:true,transparent:true,opacity:.6,sizeAttenuation:true}));
  scene.add(pts);

  const sph=new THREE.Mesh(new THREE.SphereGeometry(1.2,24,24),new THREE.MeshBasicMaterial({color:0x00c8f0,transparent:true,opacity:.85}));
  scene.add(sph);

  const cC=new THREE.Color(0x00c8f0),pC2=new THREE.Color(0x5020a0),dC=new THREE.Color(0x001224),tmp=new THREE.Color();
  const posW=geo.attributes.position,posF=fGeo.attributes.position,colA=geo.attributes.color;
  let mx=0,my=0,trx=0,try_=0;
  document.addEventListener('mousemove',e=>{mx=(e.clientX/window.innerWidth-.5)*2;my=(e.clientY/window.innerHeight-.5)*2},{passive:true});

  function wY(x,z,t){
    const r1=Math.sqrt(x*x+z*z);
    const w1=Math.sin(r1*.38-t*2.2)*Math.exp(-r1*.044)*3.5;
    const dx2=x-8,dz2=z-4,r2=Math.sqrt(dx2*dx2+dz2*dz2);
    const w2=Math.sin(r2*.32-t*1.85+1.2)*Math.exp(-r2*.054)*2;
    const higgs=r1<6?(-1.4+.06*r1*r1)*Math.exp(-r1*.11):0;
    return w1+w2+higgs;
  }

  function animate(ms){
    requestAnimationFrame(animate);
    if(mq.matches)return;
    const t=ms*.001;
    for(let i=0;i<vN;i++){
      const i3=i*3;
      const x=posW.array[i3],z=posW.array[i3+2];
      const y=wY(x,z,t);
      posW.array[i3+1]=y;posF.array[i3+1]=y;
      const n=(y+4)/8;
      if(n>.5)tmp.lerpColors(dC,cC,(n-.5)*2);else tmp.lerpColors(pC2,dC,n*2);
      colA.array[i3]=tmp.r;colA.array[i3+1]=tmp.g;colA.array[i3+2]=tmp.b;
    }
    posW.needsUpdate=true;posF.needsUpdate=true;colA.needsUpdate=true;
    const pulse=1+.16*Math.sin(t*2.8);
    sph.scale.setScalar(pulse);
    pts.rotation.y=t*.012;
    trx+=(my*.04-trx)*.04;try_+=(mx*.06-try_)*.04;
    camera.position.x=Math.sin(t*.04)*3+try_*5;
    camera.position.y=16+Math.sin(t*.06)*2-trx*3;
    camera.position.z=40+Math.sin(t*.08)*2;
    camera.lookAt(0,0,0);
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  },{passive:true});
})();
}

/* ══ I18N (TR — fallback çekirdek) ══ */
window.I18N={
tr:{
  "nav.home": "← Ana Sayfa",
  "hero.ey": "Quantro Lab · Etkileşimli Araçlar · 12 Modül",
  "hero.desc": "Kuantum mekaniğini ve astrofiziki bizzat deneyimleyin. Türkiye'nin ilk interaktif kuantum araç seti.",
  "hero.badge": "🇹🇷 Türkiye'de İlk — Quantro ARGE 2025",
  "hero.scroll": "Keşfet",
  "intro.h2": "12 Özgün<br>Araç",
  "intro.count": "Türkiye'de İlk · Quantro ARGE · 2025",
  "badge.first": "Türkiye'de İlk",
  "badge.new": "Yeni",
  "t1.title": "Kuantum Rastgelelik Motoru",
  "t1.lbl": "Kuantum Süperpozisyon Tabanlı Rastgele Sayı",
  "t1.min": "Min",
  "t1.max": "Max",
  "t1.src": "Kaynak",
  "src.q": "⚛ Gerçek Kuantum (ANU)",
  "src.s": "◌ Simüle (Web Crypto)",
  "t1.gen": "⚛ Üret",
  "t1.series": "10x Seri",
  "t1.chi": "𝝌² Test",
  "t1.clear": "Temizle",
  "t1.chi.title": "Rastgelelik Testi (Ki-Kare)",
  "t1.chi.run": "Çalıştır",
  "t1.explain": "Klasik bilgisayarlar algoritma tabanlı sahte rastgelelik üretir. Quantro, Avustralya Ulusal Üniversitesi'nin (ANU) gerçek kuantum rastgelelik motoruna bağlanır: lazerler, vakumun kuantum <strong>dalgalanmalarını</strong> ölçerek gerçek belirsizlik üretir. API erişilemezse Web Crypto simülasyonuna düşer. Heisenberg: <strong>Δx · Δp ≥ ℏ/2</strong>",
  "t2.title": "Kuantum Devre Simülatörü",
  "t2.gates.title": "Kuantum Kapıları",
  "t2.gate.h0": "H <span class=\"gd\">Hadamard q0</span>",
  "t2.gate.h1": "H <span class=\"gd\">Hadamard q1</span>",
  "t2.gate.x0": "X <span class=\"gd\">Pauli-X q0</span>",
  "t2.gate.x1": "X <span class=\"gd\">Pauli-X q1</span>",
  "t2.gate.z0": "Z <span class=\"gd\">Pauli-Z q0</span>",
  "t2.gate.z1": "Z <span class=\"gd\">Pauli-Z q1</span>",
  "t2.gate.cnot": "CNOT <span class=\"gd\">q0→q1</span>",
  "t2.reset": "Sıfırla",
  "t2.measure": "⟨ψ| Ölç",
  "t2.bell": "⚛ Bell |00⟩+|11⟩",
  "t2.clear": "Temizle",
  "t2.results": "Ölçüm Sonuçları (1024 atış)",
  "t2.explain": "<strong>Kuantum kapıları nedir?</strong> H kapısı kubiti süperpozisyona sokar. X kubiti döndürür (NOT). CNOT iki kubiti dolanıklığa sokar. <strong>Bell durumu: |Φ⁺⟩ = (|00⟩+|11⟩)/√2</strong>",
  "t3.title": "Evren Yaşı Hesaplayıcı",
  "t3.h0": "Hubble Sabiti H₀",
  "t3.om": "Madde Ωₘ",
  "t3.ol": "Karanlık Enerji ΩΛ",
  "t3.orr": "Radyasyon Ωᵣ",
  "t3.planck": "↺ Planck 2018 Değerleri",
  "t3.explain": "Friedmann denklemi: <strong>H²(a) = H₀²(Ωᵣ/a⁴ + Ωₘ/a³ + ΩΛ)</strong> — 10.000 adımlı nümerik integral ile hesaplanır.",
  "t3.age.lbl": "Evrenin Tahmini Yaşı",
  "t3.hubble.time": "Hubble Zamanı",
  "t3.horizon": "Işık Ufku",
  "t3.geometry": "Geometri",
  "t3.timeline": "Kozmik Zaman Çizelgesi",
  "t3.tl.planck": "Planck Çağı",
  "t3.tl.cmb.t": "380.000 yıl",
  "t3.tl.cmb": "CMB yayıldı",
  "t3.tl.stars": "İlk yıldızlar",
  "t3.tl.solar": "Güneş Sistemi",
  "t3.tl.now": "Şimdi — Buradasınız",
  "t3.geo.flat": "Düz (k=0)",
  "t3.geo.closed": "Kapalı (k=+1)",
  "t3.geo.open": "Açık (k=-1)",
  "t4.title": "Kuantum Şifreleme — BB84",
  "t4.eve": "👁 Dinleyici (Eve) aktif — Kuantum kanalı izleniyor",
  "t4.alice": "<em>Alice</em> — Gönderici",
  "t4.bob": "<em>Bob</em> — Alıcı",
  "t4.sent.qubits": "Gönderilen Kubitler",
  "t4.bases": "Bazlar",
  "t4.secret.key": "Gizli Anahtar",
  "t4.meas.bases": "Ölçüm Bazları",
  "t4.results": "Sonuçlar",
  "t4.shared.key": "Ortak Anahtar",
  "t4.run": "▶ BB84 Çalıştır",
  "t4.reset": "Sıfırla",
  "t4.security": "Güvenlik Düzeyi",
  "t4.nomatch": "(eşleşme yok)",
  "t4.log.start": "━━ BB84 Başladı ━━",
  "t4.log.sent": "Alice {0} kubit gönderdi",
  "t4.log.eve": "⚠ Eve kanalı dinliyor!",
  "t4.log.match": "Eşleşen baz: {0}/{1}",
  "t4.log.err": "Hata: {0} bit — Olası dinleme!",
  "t4.log.safe": "Hata yok — Kanal güvenli ✓",
  "t4.log.key": "Anahtar: {0} bit",
  "t5.title": "Heisenberg Belirsizlik Görselleştiricisi",
  "t5.dx": "Konum Belirsizliği Δx",
  "t5.explain": "<strong>Heisenberg Belirsizlik İlkesi:</strong> Bir parçacığın konumunu ne kadar kesin bilirsek, momentumunu o kadar az bileceğiz. <strong>Δx · Δp ≥ ℏ/2</strong> — Bu bir ölçüm hatası değil, doğanın kendisidir.",
  "t5.lbl.dx": "Δx (konum)",
  "t5.lbl.dp": "Δp (min)",
  "t5.lbl.prod": "Δx·Δp",
  "t5.status.ok": "✓ Belirsizlik ilkesi sağlanıyor",
  "t5.status.violation": "✗ İhlal — Doğada imkânsız!",
  "t5.phase3d": "3D Faz Uzayı — Kaydır",
  "t5.canvas.pos": "ψ(x) — Konum",
  "t5.canvas.mom": "φ(p) — Momentum",
  "t6.title": "Kara Delik Fizik Simülatörü",
  "t6.mass": "Kütle (Güneş kütlesi ×)",
  "t6.calc": "Hesapla",
  "t6.sgra": "Sgr A* (Samanyolu)",
  "t6.m87": "M87*",
  "t6.rs": "Schwarzschild Yarıçapı",
  "t6.temp": "Hawking Sıcaklığı",
  "t6.entropy": "Bekenstein Entropisi",
  "t6.explain": "<strong>Schwarzschild yarıçapı:</strong> <strong>r_s = 2GM/c²</strong> — Bu sınırın içine giren hiçbir şey, ışık dahil, dışarı çıkamaz. Hawking radyasyonu: <strong>T = ℏc³/(8πGMk_B)</strong>",
  "t7.title": "Kozmik Doppler Kayması Hesaplayıcı",
  "t7.z": "Kırmızıya Kayma z",
  "t7.l0": "Kaynak Dalga Boyu λ₀ (nm)",
  "t7.explain": "Kozmolojik kırmızıya kayma: <strong>z = (λ_obs - λ₀)/λ₀</strong>. Hubble yasası: <strong>v = H₀ · d</strong>. Evren genişledikçe uzak galaksilerden gelen ışık kırmızıya kayar.",
  "t7.obs.wl": "Gözlemlenen Dalga Boyu",
  "t7.velocity": "Hız (v/c)",
  "t7.distance": "Uzaklık",
  "t7.lookback": "Bakış Uzaklığı",
  "t7.direction": "Yön",
  "t7.blue": "← Maviye Kayma",
  "t7.red": "Kırmızıya Kayma →",
  "t7.refs": "Referans Galaksiler",
  "t7.ref.epoch.first": "İlk Galaksiler Çağı",
  "t7.ref.epoch.reion": "Reiyonizasyon Çağı",
  "t7.dir.receding": "Uzaklaşıyor (Kırmızıya kayma)",
  "t7.dir.approaching": "Yaklaşıyor (Maviye kayma)",
  "t7.dir.stationary": "Durağan",
  "t8.title": "Kuantum Işınlanma",
  "t8.go": "⚛ Işınla",
  "t8.reset": "Sıfırla",
  "t8.ready": "Hazır — \"Işınla\"ya bas.",
  "t8.explain": "Kuantum ışınlanma maddeyi değil <strong>bilgiyi</strong> taşır. Alice dolaşık bir Bell çiftinin bir yarısını paylaştığı Bob'a, ölçtüğü kübitin durumunu 2 klasik bit ile iletir; Bob düzeltme kapılarını uygulayarak kübiti <strong>birebir</strong> yeniden oluşturur. Ölçüm sonuçları gerçek kuantum rastgeleliğiyle seçilir.",
  "t8.log.bell": "<b>① Bell çifti</b> |β00⟩ = (|00⟩+|11⟩)/√2 — Alice'in q1'i ve Bob'un q2'si dolaşık",
  "t8.log.qubit": "<b>② Alice'in kübiti</b> |ψ⟩ = √0.7·|0⟩ + √0.3·|1⟩",
  "t8.log.step3": "<b>③ Alice</b> CNOT(q0→q1) ve H(q0) uygular → q0 dolaşıklığa dahil",
  "t8.log.measure": "<b>④ Bell ölçümü</b> (gerçek rastgele): {0}{1}",
  "t8.log.corr": "<b>⑤ Bob</b> düzeltme: {0}",
  "t8.log.corr.none": "gerekmedi (I)",
  "t8.log.step6": "<b>⑥ Bob'un kübiti ölçüldü</b> (400 atış): P(|1⟩) = <b>{0}</b> — beklenen 0.300",
  "t8.log.ok": "✓ Işınlanma doğrulandı — |ψ⟩ Bob'ta birebir oluştu!",
  "t8.log.no": "≈ Beklenen aralıkta değil — tekrar dene",
  "t9.title": "Bloch Küresi",
  "t9.theta": "θ (zenit)",
  "t9.phi": "φ (azimut)",
  "t9.explain": "Bloch küresi bir kübitin durumunu birim küre üzerinde gösterir. <strong>Kuzey kutup |0⟩</strong>, <strong>güney kutup |1⟩</strong>, ekvator saf süperpozisyonlardır (|+⟩, |−⟩, |+i⟩, |−i⟩). θ/φ kaydırıcıları veya ön ayar butonlarıyla durumu değiştirin; küreyi sürükleyerek görünümü döndürebilirsiniz.",
  "t9.vector": "Bloch vektörü:",
  "t10.title": "Schrödinger'in Kedisi",
  "t10.p": "Bozunma Olasılığı p",
  "t10.open": "🐱 Kutuyu Aç",
  "t10.reset": "Sıfırla",
  "t10.log.ready": "Hazır — kutuyu kapatın ve açın.",
  "t10.explain": "Schrödinger'in kedisi, süperpozisyonun saçmalığını göstermek için tasarlanmış bir düşünce deneyidir. Kutu kapalıyken kedi <strong>hem canlı hem ölüdür</strong>: durum, bozunmamış/bozunmuş çekirdeğin karışımıdır. Kutu açıldığında dalga fonksiyonu <strong>çöker</strong> ve kedi tek bir sonuçla görünür. Ölçüm sonucu gerçek kuantum rastgeleliğiyle (ANU) seçilir.",
  "t11.title": "Kuantum Tünelleme",
  "t11.energy": "Parçacık Enerjisi E",
  "t11.barrier": "Engel Yüksekliği V₀",
  "t11.width": "Engel Kalınlığı a",
  "t11.t": "İletim Olasılığı (T)",
  "t11.pres.alpha": "α Parçacığı (Füzyon)",
  "t11.pres.flash": "Flash Bellek Yazma",
  "t11.explain": "Kuantum mekaniğinde bir parçacık, enerjisinden büyük bir engelle karşılaştığında <strong>duvarı delebilir</strong> — buna tünelleme denir. Klasik fizik bunu yasaklar; kuantum dünyasında dalga fonksiyonunun kuyruğu engelin içine sızar: <strong>T ≈ exp(−2κa)</strong>. Güneş'in çekirdeğindeki füzyon, flash bellek yazma ve STM mikroskobu hep tünellemeye dayanır.",
  "t12.title": "Çift Yarık Deneyi",
  "t12.particles": "Parçacık Sayısı",
  "t12.slit": "Yarık Genişliği a",
  "t12.sep": "Yarık Aralığı d",
  "t12.wave": "Dalga Boyu λ",
  "t12.speed": "Fırlatma Hızı",
  "t12.which": "Hangi yarıktan geçti? (Gözlem)",
  "t12.fire": "⚛ Fırlat",
  "t12.reset": "Sıfırla",
  "t12.stat.coherent": "GİRİŞİM · dalga",
  "t12.stat.classical": "KLASİK · gözlem",
  "t12.explain": "Tek tek fırlatılan parçacıklar bile ekranda <strong>girişim saçakları</strong> oluşturur — her parçacık kendi kendisiyle girişir. Gözlemleyince (hangi yarık sorusu) girişim kaybolur, klasik dağılım görünür. Bu, kuantum ölçümünün dalga fonksiyonunu nasıl çökerttiğinin en meşhur kanıtıdır.",
  "stat.proxy": "⚛ ANU (proxy) — gerçek kuantum",
  "stat.anu": "⚛ ANU — gerçek kuantum (vakum dalgalanması)",
  "stat.nist": "◇ NIST Beacon — kriptografik rastgele (kuantum değil)",
  "stat.none": "◌ Dış API yok — simüle (Web Crypto)",
  "stat.init.ok": "⚛ ANU erişilebilir — gerçek kuantum hazır",
  "stat.init.fail": "◌ ANU erişilemedi — NIST/Web Crypto devrede",
  "chi.busy": "Veri toplanıyor (1024 bayt)…",
  "chi.ok": "✓ Dağılım rastgeleliğe uyumlu (p>0.05)",
  "chi.fail": "✗ Beklenenden sapma — tekrar dene",
}};

window.lastQStat=null;
const LANGS_ORDER=['tr','en','fr','es','it','ru','ko','ar'];
let LANG='tr';
function t(k,...a){let s=(I18N[LANG]&&I18N[LANG][k])||I18N.tr[k]||k;if(a.length)for(let i=0;i<a.length;i++)s=s.split('{'+i+'}').join(a[i]);return s}
function loadI18n(lang){
  if(I18N[lang])return Promise.resolve();
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='lab/i18n-'+lang+'.js';
    s.onload=res;s.onerror=rej;
    document.head.appendChild(s);
  });
}
function applyLang(){
  document.documentElement.lang=LANG;
  const btn=document.getElementById('langbtn');
  if(btn)btn.textContent=(LANG==='tr'?'TR':LANG.toUpperCase());
  btn.title='Dil / Language / Langue / Idioma / Lingua / Язык';
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.innerHTML=t(el.dataset.i18n)});
  if(window.lastQStat){const el=document.getElementById('qstat');if(el)el.textContent=t(window.lastQStat.k)}
}
function toggleLang(){
  const ns=LANGS_ORDER[(LANGS_ORDER.indexOf(LANG)+1)%LANGS_ORDER.length];
  LANG=ns;localStorage.setItem('qlang',LANG);
  const done=()=>{applyLang();try{if(window.gtag)gtag('event','lab_lang_change',{lang:LANG})}catch(e){}};
  loadI18n(LANG).then(done).catch(done);
}

/* ══ SHARED HELPERS ══ */
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}

/* ══ PWA ══ */
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(function(){})}

/* ══ BOOT ══ */
(function boot(){
  const saved=localStorage.getItem('qlang');
  LANG=(saved&&I18N[saved])?saved:'tr';
  if(LANG==='tr'){applyLang();return}
  loadI18n(LANG).then(applyLang).catch(applyLang);
})();
