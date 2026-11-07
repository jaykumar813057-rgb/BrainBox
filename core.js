/* BrainBox core: dono games aur hub ke shared tools */
const $=id=>document.getElementById(id);
const todayStr=()=>new Date().toLocaleDateString('en-CA');
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffleArr(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------- settings ---------- */
let ST={sound:true,vib:true};
try{Object.assign(ST,JSON.parse(localStorage.getItem('bb_settings')||'{}'))}catch(e){}
function saveST(){try{localStorage.setItem('bb_settings',JSON.stringify(ST))}catch(e){}}

/* ---------- audio / haptics ---------- */
let AC;
function tone(f,d=.12,type='sine',v=.15,delay=0){
 if(!ST.sound)return;
 try{
  AC=AC||new (window.AudioContext||window.webkitAudioContext)();
  if(AC.state==='suspended')AC.resume();
  const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);
 }catch(e){}
}
const sfxc={
 tap:()=>tone(620,.06,'triangle',.1),
 whoosh:()=>{tone(200,.25,'sawtooth',.05);tone(500,.3,'triangle',.07,.05);tone(900,.35,'sine',.06,.12)},
 up:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',.12,i*.07)),
 win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.3,'triangle',.15,i*.1)),
 lose:()=>[400,330,260,200].forEach((f,i)=>tone(f,.3,'sawtooth',.09,i*.15))
};
function vib(p){if(ST.vib&&navigator.vibrate)try{navigator.vibrate(p)}catch(e){}}

/* ---------- worlds (har 10 level par nayi duniya, kabhi khatam nahi) ---------- */
const WN=['Neon City','Crystal Cave','Sunset Bay','Jungle Rush','Frozen Peak','Lava Core','Sky Temple','Cyber Grid','Candy Land','Deep Ocean','Golden Desert','Haunted Fog','Toxic Lab','Cosmic Gate','Royal Palace','Thunder Fort','Pixel Realm','Dream Cloud','Shadow Void','Rainbow End'];
const WE=['🌃','💎','🌅','🌴','🏔️','🌋','⛩️','🤖','🍭','🐋','🏜️','👻','🧪','🌌','👑','⚡','👾','☁️','🌑','🌈'];
const WH=[[270,325],[185,255],[18,340],[140,75],[200,170],[8,40],[300,210],[165,285],[320,50],[205,160],[42,15],[260,150],[95,170],[240,300],[48,285],[55,200],[330,190],[210,300],[280,230],[0,200]];
function worldOf(n){
 const w=Math.floor((n-1)/10),i=w%20,c=Math.floor(w/20);
 return{w,name:WN[i]+(c?' '+(c+1):''),emoji:WE[i],h1:(WH[i][0]+c*23)%360,h2:(WH[i][1]+c*23)%360};
}
function setPalette(h1,h2){
 const b=document.body.style;
 b.setProperty('--a1','hsl('+h1+' 85% 62%)');
 b.setProperty('--a2','hsl('+h2+' 85% 60%)');
 Sky.set(h1,h2);
}

/* ---------- player (XP, level, streak) ---------- */
const Player={
 d:{xp:0,streak:0,last:''},
 load(){try{Object.assign(this.d,JSON.parse(localStorage.getItem('bb_player')||'{}'))}catch(e){}},
 save(){try{localStorage.setItem('bb_player',JSON.stringify(this.d))}catch(e){}},
 xpAt(l){return 40*(l-1)*(l-1)},
 lvl(){return Math.floor(Math.sqrt(this.d.xp/40))+1},
 pct(){const l=this.lvl(),a=this.xpAt(l),b=this.xpAt(l+1);return Math.max(0,Math.min(100,Math.round((this.d.xp-a)/(b-a)*100)))},
 add(n){const b=this.lvl();this.d.xp+=n;this.save();const a=this.lvl();return{before:b,after:a,up:a>b}},
 touch(){
  const t=todayStr();if(this.d.last===t)return;
  const y=new Date(Date.now()-864e5).toLocaleDateString('en-CA');
  this.d.streak=this.d.last===y?this.d.streak+1:1;this.d.last=t;this.save();
 },
 bar(){return '<b>Lv '+this.lvl()+'</b><div class="xp"><i style="width:'+this.pct()+'%"></i></div><span>🔥'+this.d.streak+'</span>'}
};
Player.load();Player.touch();

/* ---------- animated sky (stars + shapes + synthwave grid) ---------- */
const Sky={
 cv:null,cx:null,W:0,H:0,dpr:1,st:[],sh:[],sx:[],mode:'game',h1:270,h2:325,t1:270,t2:325,last:0,nextShoot:1800,off:0,
 init(mode){
  this.cv=$('sky');if(!this.cv)return;
  this.cx=this.cv.getContext('2d');this.mode=mode||'game';
  const low=(navigator.hardwareConcurrency||4)<=4;
  this.dpr=Math.min(window.devicePixelRatio||1,low?1:1.5);
  this.resize();window.addEventListener('resize',()=>this.resize());
  this.st=Array.from({length:low?55:95},(_,i)=>({x:Math.random(),y:Math.random(),z:i%3,p:Math.random()*6.28,s:Math.random()}));
  this.sh=Array.from({length:low?4:7},()=>this.mkShape());
  document.addEventListener('visibilitychange',()=>{this.last=performance.now()});
  requestAnimationFrame(t=>this.loop(t));
 },
 resize(){
  if(!this.cv)return;
  this.W=window.innerWidth;this.H=window.innerHeight;
  this.cv.width=Math.round(this.W*this.dpr);this.cv.height=Math.round(this.H*this.dpr);
  this.cx.setTransform(this.dpr,0,0,this.dpr,0,0);
 },
 mkShape(){return{x:Math.random(),y:Math.random(),r:16+Math.random()*34,k:Math.floor(Math.random()*4),a:Math.random()*6.28,va:(Math.random()-.5)*.8,vx:(Math.random()-.5)*.012,vy:-.004-Math.random()*.012,hue:Math.random()}},
 set(a,b){this.t1=a;this.t2=b},
 setMode(m){this.mode=m},
 loop(t){
  requestAnimationFrame(tt=>this.loop(tt));
  if(document.hidden||!this.cx)return;
  const dt=Math.min(50,(t-this.last)||16);this.last=t;
  this.h1+=(this.t1-this.h1)*.04;this.h2+=(this.t2-this.h2)*.04;
  const c=this.cx,W=this.W,H=this.H;
  c.clearRect(0,0,W,H);
  c.globalCompositeOperation='lighter';
  if(this.mode==='hub'||this.mode==='intro')this.grid(c,W,H,dt);
  const fast=this.mode==='intro'?7:1;
  for(const s of this.st){
   s.y+=(s.z+1)*.00001*dt*fast;
   if(s.y>1){s.y=0;s.x=Math.random()}
   const a=.35+.65*Math.abs(Math.sin(t*.001*(1+s.z*.5)+s.p)),sz=s.z===2?2.2:s.z===1?1.5:1;
   c.fillStyle=s.s>.7?'hsla('+this.h1+',90%,80%,'+a+')':s.s>.4?'hsla('+this.h2+',90%,80%,'+a+')':'rgba(255,255,255,'+a+')';
   c.fillRect(s.x*W,s.y*H,sz,sz*(fast>1?5:1));
  }
  c.lineWidth=1.6;
  for(const s of this.sh){
   s.x+=s.vx*dt*.06;s.y+=s.vy*dt*.06;s.a+=s.va*dt*.001;
   if(s.y<-.1){s.y=1.1;s.x=Math.random()}
   if(s.x<-.1)s.x=1.1;if(s.x>1.1)s.x=-.1;
   c.strokeStyle='hsla('+(s.hue>.5?this.h1:this.h2)+',95%,68%,.38)';
   c.save();c.translate(s.x*W,s.y*H);c.rotate(s.a);c.beginPath();
   const r=s.r;
   if(s.k===0){for(let i=0;i<6;i++){const a=i*Math.PI/3;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath()}
   else if(s.k===1){for(let i=0;i<3;i++){const a=i*2.094-1.57;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath()}
   else if(s.k===2){c.moveTo(0,-r);c.lineTo(r*.7,0);c.lineTo(0,r);c.lineTo(-r*.7,0);c.closePath()}
   else c.arc(0,0,r*.7,0,6.283);
   c.stroke();c.restore();
  }
  this.nextShoot-=dt;
  if(this.nextShoot<=0){this.nextShoot=2500+Math.random()*4500;this.sx.push({x:Math.random()*W*.8,y:Math.random()*H*.4,l:1})}
  for(const s of this.sx){
   s.x+=dt*.9;s.y+=dt*.5;s.l-=dt*.0016;
   const g=c.createLinearGradient(s.x,s.y,s.x-120,s.y-67);
   g.addColorStop(0,'rgba(255,255,255,'+Math.max(0,s.l)+')');g.addColorStop(1,'rgba(255,255,255,0)');
   c.strokeStyle=g;c.lineWidth=2;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x-120,s.y-67);c.stroke();
  }
  this.sx=this.sx.filter(s=>s.l>0);
  c.globalCompositeOperation='source-over';
 },
 grid(c,W,H,dt){
  this.off=(this.off+dt*.00035)%1;
  const hz=H*.66,col=this.h2;
  c.lineWidth=1.2;
  for(let i=0;i<10;i++){
   const z=(i+this.off)/10,y=hz+(H-hz)*z*z;
   c.strokeStyle='hsla('+col+',95%,62%,'+(.05+z*.26)+')';
   c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
  }
  for(let i=-10;i<=10;i++){
   c.strokeStyle='hsla('+col+',95%,62%,.13)';
   c.beginPath();c.moveTo(W/2+i*W*.012,hz);c.lineTo(W/2+i*W*.13,H);c.stroke();
  }
 }
};

/* ---------- particles ---------- */
const COLS=['#ffd166','#ef476f','#06d6a0','#118ab2','#a78bfa','#ffffff'];
let P=[],raf=0,cvx=null,cxx=null;
function fxInit(){
 cvx=$('fx');if(!cvx)return;cxx=cvx.getContext('2d');
 const r=()=>{cvx.width=window.innerWidth;cvx.height=window.innerHeight};
 window.addEventListener('resize',r);r();
}
function ploop(){
 cxx.clearRect(0,0,cvx.width,cvx.height);
 P=P.filter(p=>p.l>0&&p.y<cvx.height+40);
 for(const p of P){
  p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l-=p.d;p.r+=p.vr;
  cxx.save();cxx.globalAlpha=Math.min(1,Math.max(p.l,0));cxx.translate(p.x,p.y);cxx.rotate(p.r);cxx.fillStyle=p.c;
  if(p.sq)cxx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);else{cxx.beginPath();cxx.arc(0,0,p.s/2,0,7);cxx.fill()}
  cxx.restore();
 }
 raf=P.length?requestAnimationFrame(ploop):0;
 if(!P.length)cxx.clearRect(0,0,cvx.width,cvx.height);
}
function kick(){if(cxx&&!raf)raf=requestAnimationFrame(ploop)}
function burst(x,y,n=22){
 if(!cxx)return;
 for(let i=0;i<n;i++){const a=Math.random()*6.28,s=2+Math.random()*5;
  P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,g:.12,l:1,d:.03,s:4+Math.random()*5,c:COLS[i%COLS.length],r:0,vr:0})}
 kick();
}
function confetti(){
 if(!cxx)return;
 for(let i=0;i<150;i++)P.push({x:Math.random()*cvx.width,y:-20-Math.random()*250,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,g:.05,l:1.8,d:.008,s:6+Math.random()*8,c:COLS[i%COLS.length],sq:1,r:Math.random()*6,vr:(Math.random()-.5)*.3});
 kick();
}

/* ---------- UI helpers ---------- */
let modalOpen=false;
function modal(html){$('sheet').innerHTML=html;$('modal').classList.add('show');modalOpen=true}
function closeModal(){$('modal').classList.remove('show');modalOpen=false}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function banner(t,s){const d=document.createElement('div');d.className='banner';d.innerHTML='<b>'+t+'</b>'+(s?'<small>'+s+'</small>':'');document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function shareText(t){
 if(navigator.share)navigator.share({text:t}).catch(()=>{});
 else if(navigator.clipboard){navigator.clipboard.writeText(t);toast('Copy ho gaya! 📋')}
}
function go(id){
 document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
 if(typeof onScreen==='function')onScreen(id);
}
function settingsModal(){
 modal('<h2>⚙ Settings</h2>'
 +'<div class="row"><span>🔊 Sound</span><button class="tog '+(ST.sound?'on':'')+'" onclick="tgST(\'sound\')">'+(ST.sound?'ON':'OFF')+'</button></div>'
 +'<div class="row"><span>📳 Vibration</span><button class="tog '+(ST.vib?'on':'')+'" onclick="tgST(\'vib\')">'+(ST.vib?'ON':'OFF')+'</button></div>'
 +(typeof onReset==='function'?'<button class="btn ghost" onclick="onReset()">🗑 Is game ka progress reset karo</button>':'')
 +'<button class="btn primary" onclick="closeModal()">Done</button>');
}
function tgST(k){ST[k]=!ST[k];saveST();settingsModal()}

/* ---------- world map (infinite levels, 10 per world) ---------- */
function mapPage(w,o){
 const info=worldOf(w*10+1),RH=90,H=10*RH+20,xs=[50,24,12,26,52,76,88,74,50,28];
 let pts=[],nodes='';
 for(let i=0;i<10;i++){
  const n=w*10+i+1,x=xs[i],yTop=(9-i)*RH+8;
  pts.push(x+','+(yTop+34));
  const lock=n>o.unlocked,cur=n===o.unlocked,st=o.starsOf(n),boss=i===9;
  nodes+='<button class="node '+(lock?'lock ':'')+(cur?'cur ':'')+(boss?'boss ':'')+(st?'done':'')+'" style="left:calc('+x+'% - 34px);top:'+yTop+'px" '
   +(lock?'disabled':'onclick="'+o.pick+'('+n+')"')+'><b>'+(lock?'🔒':n)+'</b>'
   +(!lock&&o.subOf?'<small>'+o.subOf(n)+'</small>':'')
   +(lock?'':'<span>'+'★'.repeat(st)+'☆'.repeat(3-st)+'</span>')+'</button>';
 }
 const prev=w>0,next=(w+1)*10+1<=o.unlocked;
 return '<div class="wm-head"><button class="icon" '+(prev?'':'disabled')+' onclick="mapNav(-1)">‹</button>'
  +'<div class="wm-title"><span>'+info.emoji+'</span><b>'+info.name+'</b><small>World '+(w+1)+' · Level '+(w*10+1)+'-'+(w*10+10)+'</small></div>'
  +'<button class="icon" '+(next?'':'disabled')+' onclick="mapNav(1)">›</button></div>'
  +'<div class="wm-scroll" id="wmScroll"><div class="wm-path" style="height:'+H+'px"><svg viewBox="0 0 100 '+H+'" preserveAspectRatio="none"><polyline points="'+pts.join(' ')+'"/></svg>'+nodes+'</div></div>';
}
function mapFocus(){
 const s=$('wmScroll');if(!s)return;
 const c=s.querySelector('.node.cur');
 if(c)s.scrollTop=Math.max(0,c.offsetTop-s.clientHeight/2+34);else s.scrollTop=s.scrollHeight;
}

/* ---------- logos (SVG) ---------- */
function logoHub(sz){
 sz=sz||150;
 const P=(u,v)=>(50+38*u-38*v).toFixed(1)+','+(8+22*u+22*v).toFixed(1);
 const tile=(u0,u1,v0,v1,f)=>'<polygon points="'+P(u0,v0)+' '+P(u1,v0)+' '+P(u1,v1)+' '+P(u0,v1)+'" fill="'+f+'"/>';
 const tiles=tile(.12,.46,.12,.46,'#8b5cf6')+tile(.54,.88,.12,.46,'#ec4899')+tile(.12,.46,.54,.88,'#06b6d4')+tile(.54,.88,.54,.88,'#ffb703');
 return '<svg viewBox="0 0 100 104" width="'+sz+'" height="'+Math.round(sz*1.04)+'" aria-label="BrainBox"><defs>'
 +'<linearGradient id="hT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4ff"/><stop offset="1" stop-color="#d6a8ff"/></linearGradient>'
 +'<linearGradient id="hL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d6bff"/><stop offset="1" stop-color="#8a2be2"/></linearGradient>'
 +'<linearGradient id="hR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4fa3"/><stop offset="1" stop-color="#ff8a2b"/></linearGradient></defs>'
 +'<g stroke="#fff" stroke-opacity=".9" stroke-width="1.4" stroke-linejoin="round">'
 +'<polygon points="12,30 50,52 50,96 12,74" fill="url(#hL)"/><polygon points="50,52 88,30 88,74 50,96" fill="url(#hR)"/><polygon points="50,8 88,30 50,52 12,30" fill="url(#hT)"/></g>'
 +tiles
 +'<text transform="matrix(1 .579 0 1 12 30)" x="19" y="32" text-anchor="middle" font-size="30" font-weight="900" fill="#fff" font-family="Outfit,system-ui,sans-serif">?</text>'
 +'<text transform="matrix(1 -.579 0 1 50 52)" x="19" y="29" text-anchor="middle" font-size="13" font-weight="900" fill="#fff" font-family="Outfit,system-ui,sans-serif">2048</text></svg>';
}
function logoMemora(sz){
 sz=sz||120;
 return '<svg viewBox="0 0 100 100" width="'+sz+'" height="'+sz+'" aria-label="Memora"><defs>'
 +'<linearGradient id="mA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4fa3"/><stop offset="1" stop-color="#ff9a2b"/></linearGradient>'
 +'<linearGradient id="mB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#18d2ff"/></linearGradient></defs>'
 +'<g transform="rotate(-14 36 50)"><rect x="12" y="16" width="46" height="64" rx="10" fill="url(#mA)" stroke="#fff" stroke-opacity=".85" stroke-width="1.6"/>'
 +'<text x="35" y="58" text-anchor="middle" font-size="30" fill="#fff" fill-opacity=".9">✦</text></g>'
 +'<g transform="rotate(10 64 50)"><rect x="40" y="18" width="46" height="64" rx="10" fill="url(#mB)" stroke="#fff" stroke-width="1.8"/>'
 +'<text x="63" y="60" text-anchor="middle" font-size="40" font-weight="900" fill="#fff" font-family="Outfit,system-ui,sans-serif">?</text></g>'
 +'<g fill="#ffe066"><path d="M84 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M10 78l1.5 4.5 4.5 1.5-4.5 1.5L10 90l-1.5-4.5L4 84l4.5-1.5z"/></g></svg>';
}
function logoMergex(sz){
 sz=sz||120;
 return '<svg viewBox="0 0 100 100" width="'+sz+'" height="'+sz+'" aria-label="Mergex"><defs>'
 +'<linearGradient id="xA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ff7a18"/></linearGradient>'
 +'<linearGradient id="xB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#4f46e5"/></linearGradient>'
 +'<linearGradient id="xC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4fa3"/><stop offset="1" stop-color="#c026d3"/></linearGradient></defs>'
 +'<g transform="rotate(-12 22 22)"><rect x="4" y="4" width="32" height="32" rx="8" fill="url(#xB)" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/><text x="20" y="28" text-anchor="middle" font-size="19" font-weight="900" fill="#fff" font-family="Outfit,system-ui,sans-serif">2</text></g>'
 +'<g transform="rotate(12 78 78)"><rect x="62" y="62" width="32" height="32" rx="8" fill="url(#xC)" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/><text x="78" y="85" text-anchor="middle" font-size="19" font-weight="900" fill="#fff" font-family="Outfit,system-ui,sans-serif">4</text></g>'
 +'<rect x="22" y="22" width="56" height="56" rx="13" fill="url(#xA)" stroke="#fff" stroke-width="2.2"/>'
 +'<text x="50" y="58" text-anchor="middle" font-size="21" font-weight="900" fill="#fff" font-family="Outfit,system-ui,sans-serif">2048</text>'
 +'<g stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M90 10v10M85 15h10"/><path d="M8 84v8M4 88h8"/></g></svg>';
}
