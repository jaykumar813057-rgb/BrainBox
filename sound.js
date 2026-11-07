/* BrainBox Sound Engine — 100% generated (koi audio file nahi). Music + SFX WebAudio se bante hain. */
const Snd=(()=>{
 let curBus=null,C=null,master,comp,musicBus,sfxBus,duck,revSend,dlySend,dist,ready=false;
 let mode='off',step=0,nextT=0,timer=null,seed=1,P=null,intensity=0,beatCb=null,vis=true;
 const S=()=>window.ST||{music:true,sfx:true};
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const mtof=m=>440*Math.pow(2,(m-69)/12);
 const SCALES={minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phryg:[0,1,3,5,7,8,10],major:[0,2,4,5,7,9,11],lyd:[0,2,4,6,7,9,11],harm:[0,2,3,5,7,8,11]};
 const SC=Object.keys(SCALES);

 function mkImpulse(sec,decay){
  const n=C.sampleRate*sec|0,b=C.createBuffer(2,n,C.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay)}
  return b;
 }
 function build(ctx){
  C=ctx;
  master=C.createGain();master.gain.value=.9;
  comp=C.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=18;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.18;
  master.connect(comp);comp.connect(C.destination);
  musicBus=C.createGain();musicBus.gain.value=.55;
  duck=C.createGain();duck.gain.value=1;           // sidechain-jaisa ducking
  musicBus.connect(duck);duck.connect(master);
  sfxBus=C.createGain();sfxBus.gain.value=1.6;sfxBus.connect(master);
  const conv=C.createConvolver();conv.buffer=mkImpulse(1.8,2.6);
  revSend=C.createGain();revSend.gain.value=.5;revSend.connect(conv);
  const rg=C.createGain();rg.gain.value=.55;conv.connect(rg);rg.connect(master);
  const dl=C.createDelay(1);dl.delayTime.value=.3;const fb=C.createGain();fb.gain.value=.36;
  const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;
  dlySend=C.createGain();dlySend.gain.value=.4;dlySend.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(master);
  dist=C.createWaveShaper();const cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/512-1;cv[i]=Math.tanh(x*4)}dist.curve=cv;
  dist.connect(musicBus);
  ready=true;
 }
 function on(){const s=S();return s.sfx!==false&&s.sound!==false}
 function musicOn(){const s=S();return s.music!==false&&s.sound!==false}

 /* ---------- primitives ---------- */
 function osc(type,f,t,d,v,o={}){
  const g=C.createGain(),os=C.createOscillator();os.type=type;os.frequency.setValueAtTime(f,t);
  if(o.to)os.frequency.exponentialRampToValueAtTime(Math.max(20,o.to),t+d);
  if(o.det)os.detune.value=o.det;
  const a=o.a||.005;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  let n=os;
  if(o.lp){const fl=C.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(o.lp,t);if(o.lpTo)fl.frequency.exponentialRampToValueAtTime(o.lpTo,t+d);os.connect(fl);n=fl}
  n.connect(g);g.connect(o.dest||curBus||sfxBus);
  if(o.rev){const r=C.createGain();r.gain.value=o.rev;g.connect(r);r.connect(revSend)}
  if(o.dly){const r=C.createGain();r.gain.value=o.dly;g.connect(r);r.connect(dlySend)}
  os.start(t);os.stop(t+d+.05);
 }
 let nbuf=null;
 function noise(t,d,v,type,f,o={}){
  if(!nbuf){nbuf=C.createBuffer(1,C.sampleRate*1.5|0,C.sampleRate);const x=nbuf.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1}
  const s=C.createBufferSource();s.buffer=nbuf;const fl=C.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);fl.Q.value=o.q||1;
  if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t+d);
  const g=C.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(o.a||.003));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(fl);fl.connect(g);g.connect(o.dest||curBus||sfxBus);
  if(o.rev){const r=C.createGain();r.gain.value=o.rev;g.connect(r);r.connect(revSend)}
  s.start(t,Math.random()*.5);s.stop(t+d+.05);
 }
 const D=()=>C.currentTime+.005;

 /* ---------- SFX ---------- */
 const fx={
  tap(){const t=D();osc('triangle',900,t,.07,.12,{to:1400});osc('sine',1800,t,.05,.05)},
  whoosh(){const t=D();noise(t,.55,.18,'bandpass',300,{to:4500,q:2,rev:.4});osc('sawtooth',120,t,.5,.05,{to:900,lp:1200})},
  flip(){const t=D();noise(t,.07,.14,'highpass',2500,{q:.7});osc('sine',500+rnd()*60,t,.09,.12,{to:900});osc('triangle',1300,t+.03,.06,.05)},
  match(c=1){const t=D(),b=72+Math.min(c,8)*2,sc=[0,4,7,12,16,19];
   sc.slice(0,3+Math.min(3,c)).forEach((s,i)=>{osc('triangle',mtof(b+s),t+i*.055,.35,.13,{rev:.35,dly:.2});osc('sine',mtof(b+s+12),t+i*.055,.25,.05)});
   noise(t,.25,.08,'highpass',6000,{rev:.3});osc('sine',90,t,.18,.22,{to:45})},
  miss(){const t=D();osc('sawtooth',230,t,.32,.1,{to:90,lp:900,lpTo:200});osc('square',117,t+.02,.28,.05,{to:60,lp:500})},
  combo(c){const t=D(),b=76+c;[0,4,7,12,16,19,24].forEach((s,i)=>osc('square',mtof(b+s),t+i*.04,.22,.05,{lp:4000,rev:.3}));noise(t,.5,.1,'bandpass',2000,{to:9000,rev:.4})},
  pow(){const t=D();[0,7,12,19].forEach((s,i)=>osc('sine',mtof(84+s),t+i*.05,.4,.1,{rev:.6,dly:.4}));noise(t,.3,.05,'highpass',7000,{rev:.5})},
  peek(){const t=D();[0,2,4,7,9,12].forEach((s,i)=>osc('sine',mtof(88+s),t+i*.035,.5,.07,{rev:.7,dly:.5}))},
  freeze(){const t=D();noise(t,.7,.12,'highpass',4000,{rev:.7});[0,5,10,15].forEach((s,i)=>osc('triangle',mtof(96-s),t+i*.07,.8,.07,{rev:.9}));osc('sine',200,t,.6,.1,{to:50})},
  shuffle(){const t=D();for(let i=0;i<6;i++){noise(t+i*.05,.07,.1,'bandpass',1500+i*500,{q:3});osc('triangle',400+i*120,t+i*.05,.07,.06)}osc('sine',160,t,.3,.14,{to:70})},
  tick(u){const t=D();osc('square',u?1500:1000,t,.04,.06,{lp:3000});},
  move(){const t=D();noise(t,.05,.06,'lowpass',900,{q:.5});osc('sine',210+rnd()*30,t,.07,.06,{to:140})},
  merge(v){const k=Math.max(1,Math.log2(v||4)),b=48+k*1.6,t=D();
   osc('sine',mtof(b),t,.5,.34,{to:mtof(b)*.7});                                   // bass thump
   [0,7,12].forEach((s,i)=>osc('triangle',mtof(b+24+s),t+i*.03,.35,.12,{rev:.4,dly:.2}));
   noise(t,.12,.1+Math.min(.18,k*.012),'lowpass',3500,{to:400});
   if(v>=128){osc('sawtooth',mtof(b+12),t,.4,.07,{lp:2500,lpTo:300});}
   if(v>=512){fx.sub(t)}
   duckNow(t,.18)},
  sub(t){osc('sine',55,t,.9,.4,{to:30});noise(t,.6,.14,'lowpass',2000,{to:100,rev:.6})},
  smash(){const t=D();noise(t,.5,.3,'lowpass',5000,{to:200,rev:.5});osc('sawtooth',160,t,.4,.2,{to:40,lp:1500,lpTo:100});osc('square',900,t,.12,.1,{to:100});osc('sine',70,t,.5,.4,{to:30});duckNow(t,.3)},
  undo(){const t=D();osc('triangle',900,t,.22,.1,{to:300,rev:.3});noise(t,.2,.06,'bandpass',3000,{to:500,q:2})},
  boss(){const t=D();osc('sawtooth',55,t,1.4,.2,{to:41,lp:600});osc('sawtooth',58,t,1.4,.2,{lp:600});[0,3,6,12].forEach((s,i)=>osc('square',mtof(60+s),t+.3+i*.22,.5,.06,{lp:2200,rev:.5}));noise(t,1.2,.12,'bandpass',200,{to:3000,q:3,rev:.5});fx.sub(t+.9)},
  win(){const t=D(),n=[0,4,7,12,16,19,24,28];n.forEach((s,i)=>{osc('triangle',mtof(72+s),t+i*.09,.7,.14,{rev:.5,dly:.3});osc('sawtooth',mtof(60+s),t+i*.09,.5,.05,{lp:2500,lpTo:500})});
   [0,4,7,12].forEach(s=>osc('sawtooth',mtof(60+s),t+.8,1.6,.07,{lp:3000,lpTo:400,rev:.6}));noise(t+.75,1,.1,'highpass',5000,{rev:.6});osc('sine',60,t+.75,.6,.35,{to:35})},
  lose(){const t=D();[0,-1,-3,-5,-8].forEach((s,i)=>osc('sawtooth',mtof(62+s),t+i*.17,.5,.09,{lp:1800,lpTo:200,to:mtof(62+s)*.9}));osc('sine',100,t+.8,1,.3,{to:30});noise(t+.8,.8,.07,'lowpass',800,{rev:.5})},
  levelup(){const t=D();[0,4,7,12,7,12,16,24].forEach((s,i)=>osc('square',mtof(67+s),t+i*.06,.25,.06,{lp:4500,rev:.4,dly:.3}));noise(t,.4,.08,'highpass',6000)},
  star(i){const t=D();osc('sine',mtof(84+i*4),t,.6,.14,{rev:.7,dly:.3});osc('triangle',mtof(96+i*4),t,.3,.06);noise(t,.2,.05,'highpass',8000)},
  impact(){const t=D();fx.sub(t);noise(t,.4,.2,'lowpass',3000,{to:100,rev:.6});duckNow(t,.4)},
  riser(){const t=D();noise(t,1.2,.2,'bandpass',200,{to:7000,q:4,a:.8,rev:.5});osc('sawtooth',80,t,1.2,.08,{to:800,lp:2000,a:.9})}
 };
 const BOOST={tap:2.2,flip:2.4,move:2.6,tick:3.5,miss:2.2,undo:2.6,whoosh:4,combo:2,levelup:2.4,star:2.2,shuffle:2.2,riser:2};
 function call(name,a){const bg=C.createGain();bg.gain.value=BOOST[name]||1;bg.connect(sfxBus);curBus=bg;try{fx[name](a)}finally{curBus=null}}
 function duckNow(t,d){if(!ready)return;const g=duck.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(.35,t+.02);g.linearRampToValueAtTime(1,t+d)}

 /* ---------- MUSIC ---------- */
 const PROG=[[0,5,3,4],[0,3,4,5],[0,4,5,3],[0,5,2,4],[0,2,5,4],[0,3,5,4]];
 function plan(s){
  seed=(s*2654435761)>>>0||1;
  const scale=SC[Math.floor(rnd()*SC.length)];
  return{root:45+Math.floor(rnd()*8),scale:SCALES[scale],prog:PROG[Math.floor(rnd()*PROG.length)],
   bpm:112+Math.floor(rnd()*20),lead:Math.floor(rnd()*3),swing:rnd()*.04,
   bass:[0,0,12,0,0,7,0,12,0,0,12,0,5,0,7,10].map(x=>x),arpP:Math.floor(rnd()*3),kickP:Math.floor(rnd()*2)}
 }
 function deg(root,sc,d,oct=0){const o=Math.floor(d/7),i=((d%7)+7)%7;return root+sc[i]+12*(o+oct)}
 function kick(t,v=.7){osc('sine',150,t,.28,v,{to:42,dest:musicBus});noise(t,.02,.2,'highpass',3000,{dest:musicBus});duckNow(t,.16)}
 function snare(t,v=.35){noise(t,.2,v,'bandpass',1900,{q:.8,dest:musicBus,rev:.3});osc('triangle',190,t,.12,.15,{to:120,dest:musicBus})}
 function hat(t,v=.1,open){noise(t,open?.18:.04,v,'highpass',7500,{dest:musicBus})}
 function pad(t,notes,d,v){notes.forEach((n,i)=>{osc('sawtooth',mtof(n),t,d,v,{a:.5,lp:900,lpTo:1800,det:(i-1)*6,dest:musicBus,rev:.5})})}
 function playStep(st,t){
  const m=mode,bar=Math.floor(st/16)%4,s=st%16,ch=P.prog[bar],boss=m==='boss',hubm=m==='hub',zen=m==='zen';
  const sec=Math.floor(st/64)%4;           // 4-bar section: build-up each 16 bars
  const full=!hubm&&!zen,drops=sec>=1;
  const root=P.root-(hubm||zen?0:12)+0;
  const chordN=[0,2,4].map(i=>deg(P.root+12,P.scale,ch+i));
  if(s===0)pad(t,chordN,60/P.bpm*4*1.05,zen?.07:hubm?.05:.04);
  if(zen){
   if(s%4===0&&rnd()<.6)osc('sine',mtof(deg(P.root+24,P.scale,ch+Math.floor(rnd()*6))),t,2.2,.07,{a:.05,rev:.9,dly:.6,dest:musicBus});
   if(s===0)osc('sine',mtof(deg(P.root-12,P.scale,ch)),t,3.4,.18,{a:.3,dest:musicBus});
   return;
  }
  if(hubm){
   if(s%8===0)osc('sine',mtof(deg(P.root-12,P.scale,ch)),t,.8,.22,{dest:musicBus});
   if(s%4===2)hat(t,.05);
   if(s%2===0&&rnd()<.5)osc('triangle',mtof(deg(P.root+24,P.scale,ch+[0,2,4,7][Math.floor(rnd()*4)])),t,.5,.08,{rev:.6,dly:.4,dest:musicBus});
   if(s===0||s===10)kick(t,.35);
   return;
  }
  // gameplay / boss
  const ib=intensity>.5;
  if(s%4===0)kick(t,boss?.85:.7);
  if(boss&&(s===3||s===11||s===14))kick(t,.5);
  if(s===4||s===12)snare(t,boss?.45:.3);
  if(drops||boss){hat(t,.08+(s%4===2?.04:0),s%8===6)} else if(s%4===2)hat(t,.07,false);
  if(ib&&s%2===1)hat(t,.05);
  // bass
  const bn=P.bass[s];
  if(s%2===0||boss){
   const f=mtof(deg(P.root-12,P.scale,ch)+(bn===12?12:bn===7?7:0));
   if(s%2===0&&(drops||bn!==12||boss))osc(boss?'sawtooth':'square',f,t,.22,boss?.2:.14,{lp:boss?700:520,lpTo:200,dest:boss?dist:musicBus});
  }
  // arp
  if(drops||boss){
   const pat=[[0,1,2,1],[0,2,1,2],[2,1,0,1]][P.arpP],di=pat[s%4]+(Math.floor(s/4)%2)*2;
   osc(boss?'sawtooth':'triangle',mtof(deg(P.root+12,P.scale,ch+di*1+0)+12),t,.16,.055,{lp:3000,rev:.3,dly:.35,dest:musicBus});
  }
  // lead
  if(sec>=2&&s%2===0&&rnd()<.55){
   const k=[0,2,4,5,7,4,2,0][Math.floor(rnd()*8)];
   osc(boss?'sawtooth':'square',mtof(deg(P.root+24,P.scale,ch+k)),t,.3,.045,{lp:3500,rev:.5,dly:.5,dest:musicBus});
  }
  if(s===0&&(st%64===0)&&st>0){noise(t,.7,.1,'highpass',5000,{dest:musicBus,rev:.6})}  // crash
  if(s===12&&bar===3&&sec%2===1){for(let i=0;i<4;i++)snare(t+i*60/P.bpm/4,.2+i*.05)}   // fill
 }
 function pump(limit){
  const spb=60/(P.bpm*(1+intensity*.12))/4;
  while(nextT<limit){
   const sw=(step%2)?P.swing:0;
   if(musicOn()&&mode!=='off')playStep(step,nextT+sw);
   if(beatCb&&step%4===0){const d=Math.max(0,(nextT-C.currentTime)*1000);const cb=beatCb,s=step;setTimeout(()=>cb(s/4,mode),d)}
   nextT+=spb;step++;
  }
 }
 function loop(){if(!ready||!P||C.state!=='running'||!vis)return;pump(C.currentTime+.18)}

 /* ---------- public ---------- */
 function unlock(){
  if(!C){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;try{build(new A())}catch(e){return}}
  if(C.state==='suspended')C.resume();
  if(!timer){timer=setInterval(loop,30)}
 }
 ['pointerdown','touchstart','keydown','click'].forEach(e=>addEventListener(e,unlock,{passive:true}));
 addEventListener('visibilitychange',()=>{vis=!document.hidden;if(!C)return;if(document.hidden)C.suspend();else{C.resume();nextT=C.currentTime+.05}});
 function setMusic(m,s){
  if(m===mode&&P&&s===undefined)return;
  mode=m;if(s!==undefined)P=plan(s);else if(!P)P=plan(7);
  step=0;intensity=0;
  if(C){nextT=C.currentTime+.08;if(ready){musicBus.gain.cancelScheduledValues(C.currentTime);musicBus.gain.setValueAtTime(0,C.currentTime);musicBus.gain.linearRampToValueAtTime(m==='boss'?.6:.55,C.currentTime+1.2)}}
 }
 return{
  unlock,music:setMusic,fx,
  sfx(name,a){try{if(!on()||!ready||C.state!=='running')return;if(fx[name])call(name,a)}catch(e){}},
  intensity(x){intensity=Math.max(0,Math.min(1,x))},
  stop(){mode='off'},
  onBeat(f){beatCb=f},
  get mode(){return mode},
  refresh(){if(ready)musicBus.gain.value=musicOn()?.55:0},
  // offline render for testing: Snd.render(mode,seed,seconds) -> Promise<AudioBuffer>
  async render(m,s,sec){
   const oc=new OfflineAudioContext(2,44100*sec,44100);const old=C,oR=ready;build(oc);
   mode=m;P=plan(s);step=0;intensity=0;nextT=0;pump(sec);
   const buf=await oc.startRendering();C=old;ready=oR;return buf;
  },
  async renderFx(name,a){
   const oc=new OfflineAudioContext(2,44100*3,44100);const old=C,oR=ready;build(oc);
   call(name,a);const buf=await oc.startRendering();C=old;ready=oR;return buf;
  }
 };
})();
