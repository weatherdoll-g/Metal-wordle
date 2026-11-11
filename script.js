const MAX_GUESSES = 10;
const EPOCH = "2026-01-01";
const STORAGE_KEY = "metle-v1";
const $ = id => document.getElementById(id);

let bands = [];
let selectedBand = null;
let guesses = [];
let gameOver = false;
let dailyBand = null;
let stats = loadStats();
let activeSuggestion = -1;

function freshStats(){return {played:0,wins:0,currentStreak:0,bestStreak:0,lastWinDate:null,guessTotal:0,completed:{},games:{}}}
function loadStats(){
  try { return {...freshStats(),...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}; }
  catch { return freshStats(); }
}
function saveStats(){localStorage.setItem(STORAGE_KEY,JSON.stringify(stats));}
function utcDateString(date=new Date()){return date.toISOString().slice(0,10);}
function dayNumber(dateString){
  return Math.floor((new Date(`${dateString}T00:00:00Z`).getTime()-new Date(`${EPOCH}T00:00:00Z`).getTime())/86400000);
}
function normalize(value){return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function chooseDailyBand(date){return bands[((dayNumber(date)%bands.length)+bands.length)%bands.length];}

const borders={
  "norway":["sweden","finland","russia"],"sweden":["norway","finland"],"finland":["sweden","norway","russia"],
  "germany":["denmark","poland","czech republic","austria","switzerland","france","luxembourg","belgium","netherlands"],
  "france":["belgium","luxembourg","germany","switzerland","italy","monaco","andorra","spain"],
  "poland":["germany","czech republic","slovakia","ukraine","belarus","lithuania","russia"],
  "canada":["united states"],"united states":["canada","mexico"],"united states of america":["canada","mexico"],
  "united kingdom":[],"czech republic":["germany","poland","slovakia","austria"],"denmark":["germany"],
  "austria":["germany","czech republic","slovakia","hungary","slovenia","italy","switzerland","liechtenstein"],
  "switzerland":["france","germany","austria","liechtenstein","italy"],"italy":["france","switzerland","austria","slovenia"],
  "belgium":["france","luxembourg","germany","netherlands"],"netherlands":["belgium","germany"],
  "spain":["france","andorra","portugal"],"portugal":["spain"],"russia":["norway","finland","poland","lithuania","estonia","latvia"],
  "ukraine":["poland","slovakia","hungary","romania","moldova","belarus","russia"],"slovakia":["poland","czech republic","austria","hungary","ukraine"],
  "hungary":["austria","slovakia","ukraine","romania","serbia","croatia","slovenia"],"romania":["ukraine","moldova","bulgaria","serbia","hungary"],
  "serbia":["hungary","romania","bulgaria","north macedonia","albania","montenegro","bosnia and herzegovina","croatia"],
  "croatia":["slovenia","hungary","serbia","bosnia and herzegovina","montenegro"],"slovenia":["italy","austria","hungary","croatia"],
  "bulgaria":["romania","serbia","north macedonia","greece","turkey"],"greece":["albania","north macedonia","bulgaria","turkey"],
  "mexico":["united states","guatemala","belize"],"guatemala":["mexico","belize","honduras","el salvador"],
  "belize":["mexico","guatemala"],"honduras":["guatemala","el salvador","nicaragua"],"el salvador":["guatemala","honduras"]
};
function countriesTouch(a,b){return (borders[a.toLowerCase()]||[]).includes(b.toLowerCase());}
function compareGuess(guess,answer){
  const d=Math.abs(guess.debut_year-answer.debut_year);
  return {
    year:d===0?"green":d<=3?"yellow":"black",
    genre:guess.subgenre===answer.subgenre?"green":guess.parent_genre===answer.parent_genre?"yellow":"black",
    country:guess.country===answer.country?"green":countriesTouch(guess.country,answer.country)?"yellow":"black",
    status:guess.active===answer.active?"green":"black"
  };
}
function saveCurrentGame(){
  stats.games[utcDateString()]={guessNames:guesses.map(g=>g.name),over:gameOver};
  saveStats();
}
function renderSuggestions(query){
  const box=$("suggestions");activeSuggestion=-1;
  if(!query.trim()||gameOver){box.hidden=true;box.innerHTML="";return;}
  const q=normalize(query);
  const matches=bands.filter(b=>normalize(b.name).includes(q)||(b.aliases||[]).some(a=>normalize(a).includes(q)))
    .filter(b=>!guesses.some(g=>g.name===b.name)).slice(0,8);
  box.innerHTML=matches.length?matches.map((b,i)=>`<button class="suggestion" type="button" role="option" data-index="${i}" data-name="${escapeHtml(b.name)}"><span>${escapeHtml(b.name)}</span><small>${escapeHtml(b.country)} / ${b.debut_year}</small></button>`).join(""):`<div class="no-results">NO MATCHING BANDS.</div>`;
  box.hidden=false;
  box.querySelectorAll(".suggestion").forEach(btn=>btn.addEventListener("click",()=>chooseBand(btn.dataset.name)));
}
function chooseBand(name){selectedBand=bands.find(b=>b.name===name)||null;$("band-input").value=selectedBand?selectedBand.name:"";$("suggestions").hidden=true;$("band-input").focus();}
function renderGuess(guess){
  const empty=$("guess-history").querySelector(".empty-state");if(empty)empty.remove();
  const c=compareGuess(guess,dailyBand);
  const tiles=[{v:guess.name,cls:"band-tile"},{v:guess.debut_year,cls:c.year},{v:guess.subgenre,cls:c.genre},{v:guess.country,cls:c.country},{v:guess.active?"Active":"Disbanded",cls:c.status}];
  const row=document.createElement("div");row.className="guess-grid guess-row";
  row.innerHTML=tiles.map(t=>`<div class="tile ${t.cls}">${escapeHtml(t.v)}</div>`).join("");
  $("guess-history").prepend(row);
}
function updateProgress(){$("attempt-count").textContent=guesses.length;$("progress-fill").style.width=`${guesses.length/MAX_GUESSES*100}%`;}
function submitGuess(){
  if(gameOver)return;
  const typed=$("band-input").value.trim();
  if(!selectedBand&&typed)selectedBand=bands.find(b=>normalize(b.name)===normalize(typed)||(b.aliases||[]).some(a=>normalize(a)===normalize(typed)))||null;
  if(!selectedBand){$("search-hint").textContent="SELECT A BAND FROM THE LIST.";return;}
  if(guesses.some(g=>g.name===selectedBand.name)){selectedBand=null;$("band-input").value="";return;}
  const guess=selectedBand;selectedBand=null;guesses.push(guess);
  $("band-input").value="";$("suggestions").hidden=true;renderGuess(guess);updateProgress();saveCurrentGame();
  if(guess.name===dailyBand.name)finishGame(true);
  else if(guesses.length>=MAX_GUESSES)finishGame(false);
}
function answerDetails(){return `<p>${dailyBand.debut_year} / ${escapeHtml(dailyBand.subgenre)} / ${escapeHtml(dailyBand.country)} / ${dailyBand.active?"Active":"Disbanded"}<br><span class="small-note">FIRST RELEASE: ${escapeHtml(dailyBand.first_release)}</span></p>`;}
function shareText(){
  const n=Math.max(1,dayNumber(utcDateString())+1);
  const rows=guesses.map(g=>{const c=compareGuess(g,dailyBand);return [c.year,c.genre,c.country,c.status].map(x=>({green:"🟩",yellow:"🟨",black:"⬛"}[x])).join("");}).join("\n");
  const won=guesses.some(g=>g.name===dailyBand.name);
  return `METLE / TAPE ${n} / ${won?guesses.length:"X"}/10\n${rows}`;
}
function resultActions(){return `<div class="result-actions"><button class="primary-button" id="copy-result">COPY RESULT ↗</button></div>`;}
function finishGame(won){
  if(gameOver)return;gameOver=true;
  $("band-input").disabled=true;$("guess-button").disabled=true;$("guess-button").style.opacity=".5";
  const today=utcDateString();
  if(!stats.completed[today]){
    stats.played++;if(won){stats.wins++;stats.guessTotal+=guesses.length;const yesterday=utcDateString(new Date(Date.now()-86400000));stats.currentStreak=stats.lastWinDate===yesterday?stats.currentStreak+1:1;stats.bestStreak=Math.max(stats.bestStreak,stats.currentStreak);stats.lastWinDate=today;}else stats.currentStreak=0;
    stats.completed[today]={won,guesses:guesses.length};
  }
  saveCurrentGame();
  const panel=$("result-panel");panel.hidden=false;
  panel.innerHTML=won?`<div class="modal-stamp">TRANSMISSION COMPLETE</div><h3>THE BAND IS FOUND.</h3><p><b class="answer-name">${escapeHtml(dailyBand.name)}</b> / SOLVED IN ${guesses.length} ${guesses.length===1?"GUESS":"GUESSES"}.</p>${answerDetails()}${resultActions()}`:`<div class="modal-stamp">END OF THE TAPE</div><h3>THE BAND REMAINS.</h3><p>THE ANSWER WAS <b class="answer-name">${escapeHtml(dailyBand.name)}</b>.</p>${answerDetails()}${resultActions()}`;
  $("copy-result").addEventListener("click",copyResult);updateStats();
}
async function copyResult(){
  const text=shareText();try{await navigator.clipboard.writeText(text);$("copy-result").textContent="COPIED!";}catch{window.prompt("Copy your result:",text);}
}
function updateStats(){
  const rate=stats.played?Math.round(stats.wins/stats.played*100):0;
  $("stat-played").textContent=stats.played;$("stat-winrate").textContent=`${rate}%`;$("stat-streak").textContent=stats.currentStreak;
  $("modal-played").textContent=stats.played;$("modal-wins").textContent=stats.wins;$("modal-winrate").textContent=`${rate}%`;$("modal-streak").textContent=stats.currentStreak;$("modal-best").textContent=stats.bestStreak;$("modal-average").textContent=stats.wins?(stats.guessTotal/stats.wins).toFixed(1):"—";
}
function openDialog(id){$(id).showModal();}
function wireDialogs(){
  $("help-button").addEventListener("click",()=>openDialog("help-dialog"));$("stats-button").addEventListener("click",()=>openDialog("stats-dialog"));$("view-stats").addEventListener("click",()=>openDialog("stats-dialog"));
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close();}));
  $("share-stats").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(shareText());$("share-stats").textContent="COPIED!";}catch{window.prompt("Copy your result:",shareText());}});
}
function restoreGame(){
  const saved=stats.games[utcDateString()];if(!saved)return;
  guesses=(saved.guessNames||[]).map(name=>bands.find(b=>b.name===name)).filter(Boolean);
  guesses.forEach(renderGuess);updateProgress();
  if(saved.over){gameOver=true;$("band-input").disabled=true;$("guess-button").disabled=true;const won=guesses.some(g=>g.name===dailyBand.name);const panel=$("result-panel");panel.hidden=false;panel.innerHTML=won?`<div class="modal-stamp">TRANSMISSION COMPLETE</div><h3>THE BAND IS FOUND.</h3><p><b class="answer-name">${escapeHtml(dailyBand.name)}</b> / SOLVED IN ${guesses.length} ${guesses.length===1?"GUESS":"GUESSES"}.</p>${answerDetails()}${resultActions()}`:`<div class="modal-stamp">END OF THE TAPE</div><h3>THE BAND REMAINS.</h3><p>THE ANSWER WAS <b class="answer-name">${escapeHtml(dailyBand.name)}</b>.</p>${answerDetails()}${resultActions()}`;$("copy-result").addEventListener("click",copyResult);}
}
async function init(){
  try{
    const response=await fetch("bands.json");if(!response.ok)throw new Error("Could not load bands.json");
    bands=await response.json();if(!Array.isArray(bands)||bands.length<2)throw new Error("Band database needs at least two bands.");
    dailyBand=chooseDailyBand(utcDateString());
    $("puzzle-number").textContent=`TAPE ${String(Math.max(1,dayNumber(utcDateString())+1)).padStart(3,"0")}`;
    $("today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
    $("band-input").addEventListener("input",e=>{selectedBand=null;renderSuggestions(e.target.value);});
    $("band-input").addEventListener("keydown",e=>{
      const items=[...$("suggestions").querySelectorAll(".suggestion")];
      if(e.key==="ArrowDown"&&items.length){e.preventDefault();activeSuggestion=(activeSuggestion+1)%items.length;items.forEach((b,i)=>b.classList.toggle("active",i===activeSuggestion));}
      else if(e.key==="ArrowUp"&&items.length){e.preventDefault();activeSuggestion=(activeSuggestion-1+items.length)%items.length;items.forEach((b,i)=>b.classList.toggle("active",i===activeSuggestion));}
      else if(e.key==="Enter"){e.preventDefault();if(activeSuggestion>=0&&items[activeSuggestion])chooseBand(items[activeSuggestion].dataset.name);else submitGuess();}
      else if(e.key==="Escape")$("suggestions").hidden=true;
    });
    $("guess-button").addEventListener("click",submitGuess);
    document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("suggestions").hidden=true;});
    wireDialogs();updateStats();restoreGame();
  }catch(error){console.error(error);$("guess-history").innerHTML='<div class="empty-state"><b>DATABASE ERROR</b><span>CHECK THAT bands.json IS IN THE REPOSITORY ROOT.</span></div>';$("band-input").disabled=true;$("guess-button").disabled=true;}
}
init();
