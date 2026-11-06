/* Global leaderboard on Supabase free tier.
   Jab tak url aur key khali hain, leaderboard buttons chhupe rehte hain aur game normal chalta hai.
   Setup: supabase.sql chalao, phir neeche apna Project URL aur anon/publishable key daalo. */
const LB={
 url:'',   // e.g. 'https://abcdxyz.supabase.co'
 key:'',   // anon / publishable key (client mein rakhna safe hai, RLS ke saath)

 get on(){return !!(this.url&&this.key)},
 name(){try{return localStorage.getItem('lb_name')||''}catch(e){return ''}},
 setName(n){try{localStorage.setItem('lb_name',n)}catch(e){}},
 h(){return{apikey:this.key,Authorization:'Bearer '+this.key,'Content-Type':'application/json'}},
 esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))},

 async top(board,n=20){
  const r=await fetch(this.url+'/rest/v1/scores?board=eq.'+encodeURIComponent(board)+'&select=name,score&order=score.desc&limit=200',{headers:this.h()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const rows=await r.json(),seen=new Set(),out=[];
  for(const x of rows){
   const k=String(x.name).toLowerCase();
   if(seen.has(k))continue;
   seen.add(k);out.push(x);
   if(out.length>=n)break;
  }
  return out;
 },

 async send(board,name,score){
  const r=await fetch(this.url+'/rest/v1/scores',{method:'POST',headers:Object.assign({Prefer:'return=minimal'},this.h()),body:JSON.stringify({board:board,name:name,score:Math.round(score)})});
  if(!r.ok)throw new Error('HTTP '+r.status);
 },

 async open(board,title){
  modal('<h2>🏆 '+this.esc(title)+'</h2><p style="opacity:.7">Load ho raha hai…</p>');
  let html;
  try{
   const rows=await this.top(board),me=this.name().toLowerCase();
   html=rows.length?rows.map((x,i)=>{
    const mine=String(x.name).toLowerCase()===me;
    return '<div style="display:flex;gap:10px;align-items:center;padding:9px 12px;margin:5px 0;border-radius:12px;font-weight:700;text-align:left;background:rgba(255,255,255,'+(mine?0.22:0.08)+')">'
     +'<span style="width:28px">'+(['🥇','🥈','🥉'][i]||(i+1))+'</span>'
     +'<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+this.esc(x.name)+'</span>'
     +'<b>'+this.esc(x.score)+'</b></div>';
   }).join(''):'<p style="opacity:.7">Abhi koi score nahi. Pehle aap bano! 🚀</p>';
  }catch(e){html='<p style="opacity:.8">Leaderboard load nahi hua. Internet check karo.</p>'}
  modal('<h2>🏆 '+this.esc(title)+'</h2>'+html+'<button class="btn primary" onclick="closeModal()" style="margin-top:12px">Close</button>');
 },

 async submit(board,title,score){
  const inp=prompt('Leaderboard ke liye apna naam likho (max 16 letters):',this.name());
  if(inp===null)return;
  const n=inp.trim().slice(0,16);
  if(!n){toast('Naam zaroori hai');return}
  this.setName(n);
  try{await this.send(board,n,score);toast('Score bhej diya! 🎉')}
  catch(e){toast('Score nahi gaya, internet check karo')}
  this.open(board,title);
 }
};
