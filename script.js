'use strict';
const $=id=>document.getElementById(id),MAX=10,KEY='metle-v3',EPOCH='2026-01-01';
let bands=[],pool=[],answer,guesses=[],done=false,chosen=null,stats=loadStats(),active=-1;
function fresh(){return{played:0,won:0,streak:0,last:null,games:{}}}
function loadStats(){try{return{...fresh(),...JSON.parse(localStorage.getItem(KEY))}}catch{return fresh()}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(stats))}catch(e){console.warn('Could not save local stats',e)}}
function norm(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function esc(s){return String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function isPlayable(b){return Number.isInteger(b.debut_year)&&!!b.country&&typeof b.active==='boolean'&&Array.isArray(b.genres)&&b.genres.length>0&&!!b.first_release&&!!b.status}
function day(){return new Date().toISOString().slice(0,10)}
function num(){return Math.floor((Date.parse(day()+'T00:00:00Z')-Date.parse(EPOCH+'T00:00:00Z'))/86400000)}
const borders={
  norway:['sweden','finland','russia'],sweden:['norway','finland'],finland:['sweden','norway','russia'],
  germany:['denmark','poland','czechia','austria','switzerland','france','luxembourg','belgium','netherlands'],
  france:['belgium','luxembourg','germany','switzerland','italy','monaco','andorra','spain'],
  poland:['germany','czechia','slovakia','ukraine','belarus','lithuania','russia'],
  canada:['united states'],'united states':['canada','mexico'],mexico:['united states','guatemala','belize'],
  czechia:['germany','poland','slovakia','austria'],denmark:['germany'],
  austria:['germany','czechia','slovakia','hungary','slovenia','italy','switzerland','liechtenstein'],
  switzerland:['france','germany','austria','liechtenstein','italy'],italy:['france','switzerland','austria','slovenia'],
  belgium:['france','luxembourg','germany','netherlands'],netherlands:['belgium','germany'],
  spain:['france','andorra','portugal'],portugal:['spain'],russia:['norway','finland','poland','lithuania'],
  ukraine:['poland','slovakia','hungary','romania','moldova','belarus','russia'],
  slovakia:['poland','czechia','austria','hungary','ukraine'],
  hungary:['austria','slovakia','ukraine','romania','serbia','croatia','slovenia'],
  romania:['ukraine','moldova','bulgaria','serbia','hungary'],
  serbia:['hungary','romania','bulgaria','north macedonia','albania','montenegro','bosnia and herzegovina','croatia'],
  croatia:['slovenia','hungary','serbia','bosnia and herzegovina','montenegro'],
  slovenia:['italy','austria','hungary','croatia'],bulgaria:['romania','serbia','north macedonia','greece','turkey'],
  greece:['albania','north macedonia','bulgaria','turkey']
};
function touches(a,b){const x=norm(a),y=norm(b);return (borders[x]||[]).includes(y)||(borders[y]||[]).includes(x)}
function compare(g){
  const c={year:'na',genre:'na',country:'na',status:'na'};
  const d=Math.abs(g.debut_year-answer.debut_year);c.year=d===0?'green':d<=3?'yellow':'black';
  const exact=g.genres.some(x=>answer.genres.includes(x));
  const family=(g.parent_genres||[]).some(x=>(answer.parent_genres||[]).includes(x));
  c.genre=exact?'green':family?'yellow':'black';
  c.country=g.country===answer.country?'green':touches(g.country,answer.country)?'yellow':'black';
  c.status=g.active===answer.active?'green':'black';
  return c;
}
function tile(v,cls){return `<div class="tile ${cls}">${esc(v)}</div>`}
function draw(g){
  $('history').querySelector('.empty')?.remove();const c=compare(g);
  const row=document.createElement('div');row.className='grid guess';
  row.innerHTML=tile(g.name,'name')+tile(g.debut_year,c.year)+tile(g.genres.join(' / '),c.genre)+tile(g.country,c.country)+tile(g.status,c.status);
  $('history').prepend(row);
}
function progress(){$('count').textContent=`${guesses.length} / ${MAX}`;$('bar').style.width=(guesses.length/MAX*100)+'%'}
function suggest(q){
  const box=$('suggestions');active=-1;if(!q.trim()||done){box.hidden=true;return}
  const n=norm(q),matches=bands.filter(b=>norm(b.name).includes(n)||(b.aliases||[]).some(a=>norm(a).includes(n)))
    .filter(b=>!guesses.some(g=>g.name===b.name)).slice(0,9);
  box.innerHTML=matches.length?matches.map(b=>{const ready=isPlayable(b);return `<button class="suggestion" data-name="${esc(b.name)}" ${ready?'':'disabled'}><span>${esc(b.name)}</span><small>${ready?`${b.debut_year} / ${esc(b.country)}`:'PROFILE NEEDED'}</small></button>`}).join(''):'<div class="suggestion">NO MATCHING BANDS</div>';
  box.hidden=false;box.querySelectorAll('button:not(:disabled)').forEach(x=>x.onclick=()=>pick(x.dataset.name));
}
function pick(n){chosen=bands.find(b=>b.name===n);$('entry').value=chosen?.name||'';$('suggestions').hidden=true;$('entry').focus()}
function submit(){
  if(done)return;
  const typed=$('entry').value;
  const b=chosen||pool.find(x=>norm(x.name)===norm(typed)||(x.aliases||[]).some(a=>norm(a)===norm(typed)));
  if(!b){$('hint').textContent='CHOOSE A COMPLETE BAND PROFILE FROM THE AUTOCOMPLETE LIST.';return}
  if(guesses.some(x=>x.name===b.name)){$('hint').textContent='YOU ALREADY GUESSED THAT BAND.';return}
  chosen=null;guesses.push(b);$('entry').value='';$('suggestions').hidden=true;$('hint').textContent='';draw(b);progress();saveGame();
  if(b.name===answer.name)finish(true);else if(guesses.length>=MAX)finish(false);
}
function saveGame(){stats.games[day()]={names:guesses.map(x=>x.name),done};save()}
function result(){
  const win=guesses.some(x=>x.name===answer.name);$('result').hidden=false;
  $('result').innerHTML=`<h2>${win?'BAND IDENTIFIED':'TAPE ENDED'}</h2><p>THE ANSWER WAS <strong>${esc(answer.name)}</strong><br>${answer.debut_year} · ${esc(answer.country)} · ${esc(answer.status)}<br>${esc(answer.first_release)}</p><button id="copy">COPY RESULT</button>`;
  $('copy').onclick=copy;
}
function finish(win){
  if(done)return;done=true;
  if(!stats.games[day()]?.done){stats.played++;if(win){stats.won++;const y=new Date(Date.now()-86400000).toISOString().slice(0,10);stats.streak=stats.last===y?stats.streak+1:1;stats.last=day()}else stats.streak=0}
  saveGame();$('entry').disabled=true;$('submit').disabled=true;result();statsView();
}
function share(){return `METLE / ${day()} / ${guesses.some(x=>x.name===answer.name)?guesses.length:'X'}/10\n`+guesses.map(g=>{const c=compare(g);return ['year','genre','country','status'].map(k=>({green:'🟩',yellow:'🟨',black:'⬛',na:'⬛'}[c[k]])).join('')}).join('\n')}
async function copy(){try{await navigator.clipboard.writeText(share());$('copy').textContent='COPIED'}catch{prompt('Copy result',share())}}
function statsView(){$('played').textContent=stats.played;$('won').textContent=stats.won;$('rate').textContent=(stats.played?Math.round(stats.won/stats.played*100):0)+'%';$('streak').textContent=stats.streak}
function restore(){
  const s=stats.games[day()];if(!s)return;
  guesses=(s.names||[]).map(n=>bands.find(b=>norm(b.name)===norm(n))).filter(b=>b&&isPlayable(b));guesses.forEach(draw);progress();
  if(s.done){done=true;$('entry').disabled=true;$('submit').disabled=true;result()}
}
async function init(){
  try{
    const r=await fetch('./bands.json');if(!r.ok)throw Error('bands.json not found');bands=await r.json();
    pool=bands.filter(isPlayable);
    if(!pool.length)throw Error('No complete band profiles found.');
    answer=pool[((num()%pool.length)+pool.length)%pool.length];
    $('date').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
    $('pool').textContent=`${pool.length} PLAYABLE / ${bands.length} BANDS LISTED`;
    $('entry').oninput=e=>{chosen=null;suggest(e.target.value)};
    $('entry').onkeydown=e=>{
      const items=[...$('suggestions').querySelectorAll('button')];
      if(e.key==='ArrowDown'&&items.length){e.preventDefault();active=(active+1)%items.length;items.forEach((x,i)=>x.classList.toggle('active',i===active))}
      else if(e.key==='ArrowUp'&&items.length){e.preventDefault();active=(active-1+items.length)%items.length;items.forEach((x,i)=>x.classList.toggle('active',i===active))}
      else if(e.key==='Enter'){e.preventDefault();if(active>=0&&items[active])pick(items[active].dataset.name);else submit()}
      else if(e.key==='Escape')$('suggestions').hidden=true;
    };
    $('submit').onclick=submit;
    document.addEventListener('click',e=>{if(!e.target.closest('.search'))$('suggestions').hidden=true});
    $('rules').onclick=()=>$('rules-dialog').showModal();$('stats').onclick=()=>$('stats-dialog').showModal();
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
    statsView();restore();
  }catch(e){console.error(e);$('history').innerHTML='<p class="empty">DATABASE ERROR — CHECK bands.json.</p>';$('submit').disabled=true}
}
init();
