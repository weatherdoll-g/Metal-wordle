const MAX_GUESSES = 10;
const EPOCH = "2026-01-01";
const STORAGE_KEY = "metaldle-v1";
const $ = (id) => document.getElementById(id);

let bands = [];
let selectedBand = null;
let guesses = [];
let gameOver = false;
let dailyBand = null;
let stats = loadStats();
let activeSuggestion = -1;

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      played: 0, wins: 0, currentStreak: 0, bestStreak: 0,
      lastPlayedDate: null, lastWinDate: null, guessTotal: 0,
      completed: {}
    };
  } catch {
    return {played:0,wins:0,currentStreak:0,bestStreak:0,lastPlayedDate:null,lastWinDate:null,guessTotal:0,completed:{}};
  }
}
function saveStats() { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); }
function utcDateString(date = new Date()) { return date.toISOString().slice(0,10); }
function dayNumber(dateString) {
  const start = new Date(`${EPOCH}T00:00:00Z`).getTime();
  const current = new Date(`${dateString}T00:00:00Z`).getTime();
  return Math.floor((current - start) / 86400000);
}
function hashString(str) {
  let h = 2166136261;
  for (let i=0;i<str.length;i++) { h ^= str.charCodeAt(i); h = Math.imul(h,16777619); }
  return h >>> 0;
}
function chooseDailyBand(dateString) {
  // Deterministic daily rotation: everybody gets the same answer on the same UTC date.
  const index = Math.abs(dayNumber(dateString)) % bands.length;
  return bands[index];
}
function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function countryKey(country) { return country.toLowerCase(); }

const borders = {
  "norway":["sweden","finland","russia"],
  "sweden":["norway","finland"],
  "finland":["sweden","norway","russia"],
  "germany":["denmark","poland","czech republic","austria","switzerland","france","luxembourg","belgium","netherlands"],
  "france":["belgium","luxembourg","germany","switzerland","italy","monaco","andorra","spain"],
  "poland":["germany","czech republic","slovakia","ukraine","belarus","lithuania","russia"],
  "canada":["united states"],
  "united states":["canada","mexico"],
  "united kingdom":[],
  "united states of america":["canada","mexico"]
};

function compareGuess(guess, answer) {
  const yearDiff = Math.abs(guess.debut_year - answer.debut_year);
  const year = yearDiff === 0 ? "green" : yearDiff <= 3 ? "yellow" : "black";
  const genre = guess.subgenre === answer.subgenre ? "green" :
    guess.parent_genre === answer.parent_genre ? "yellow" : "black";
  const aCountry = countryKey(guess.country), gCountry = countryKey(answer.country);
  const country = aCountry === gCountry ? "green" :
    (borders[aCountry] || []).includes(gCountry) ? "yellow" : "black";
  const status = guess.active === answer.active ? "green" : "black";
  return {year,genre,country,status};
}
function isExactWin(guess, answer) { return guess.name === answer.name; }

function renderSuggestions(query) {
  const box = $("suggestions");
  activeSuggestion = -1;
  if (!query.trim() || gameOver) { box.hidden = true; box.innerHTML = ""; return; }
  const q = normalize(query);
  const matches = bands.filter(b => normalize(b.name).includes(q) ||
    (b.aliases || []).some(a => normalize(a).includes(q)))
    .filter(b => !guesses.some(g => g.name === b.name))
    .slice(0,8);
  box.innerHTML = matches.length ? matches.map((b,i) =>
    `<button class="suggestion" type="button" role="option" data-index="${i}" data-name="${escapeHtml(b.name)}"><span>${escapeHtml(b.name)}</span><small>${escapeHtml(b.country)} · ${b.debut_year}</small></button>`
  ).join("") : `<div class="no-results">No matching bands found${bands.some(b=>normalize(b.name)===q) ? " — already guessed!" : "."}</div>`;
  box.hidden = false;
  box.querySelectorAll(".suggestion").forEach(btn => btn.addEventListener("click", () => chooseBand(btn.dataset.name)));
}
function chooseBand(name) {
  selectedBand = bands.find(b => b.name === name) || null;
  $("band-input").value = selectedBand ? selectedBand.name : "";
  $("suggestions").hidden = true;
  $("band-input").focus();
}
function submitGuess() {
  if (gameOver) return;
  const typed = $("band-input").value.trim();
  if (!selectedBand && typed) {
    const exact = bands.find(b => normalize(b.name) === normalize(typed) ||
      (b.aliases || []).some(a => normalize(a) === normalize(typed)));
    if (exact) selectedBand = exact;
  }
  if (!selectedBand) {
    $("band-input").focus();
    $("search-hint").textContent = "Choose a band from the suggestions before guessing.";
    return;
  }
  if (guesses.some(g => g.name === selectedBand.name)) {
    selectedBand = null;
    $("band-input").value = "";
    return;
  }
  const guess = selectedBand;
  selectedBand = null;
  guesses.push(guess);
  $("band-input").value = "";
  $("suggestions").hidden = true;
  renderGuess(guess);
  updateProgress();
  if (isExactWin(guess, dailyBand)) finishGame(true);
  else if (guesses.length >= MAX_GUESSES) finishGame(false);
}
function renderGuess(guess) {
  const empty = $("guess-history").querySelector(".empty-state");
  if (empty) empty.remove();
  const result = compareGuess(guess,dailyBand);
  const row = document.createElement("div");
  row.className = "guess-grid guess-row";
  const tiles = [
    {value:guess.name,cls:"band-tile"},
    {value:guess.debut_year,cls:result.year},
    {value:guess.subgenre,cls:result.genre},
    {value:guess.country,cls:result.country},
    {value:guess.active ? "Active" : "Disbanded",cls:result.status}
  ];
  row.innerHTML = tiles.map(t => `<div class="tile ${t.cls}">${escapeHtml(t.value)}</div>`).join("");
  $("guess-history").prepend(row);
}
function updateProgress() {
  $("attempt-count").textContent = guesses.length;
  $("progress-fill").style.width = `${guesses.length / MAX_GUESSES * 100}%`;
}
function finishGame(won) {
  gameOver = true;
  $("band-input").disabled = true;
  $("guess-button").disabled = true;
  $("guess-button").style.opacity = ".5";
  const today = utcDateString();
  const alreadyCompleted = Boolean(stats.completed[today]);
  if (!alreadyCompleted) {
    stats.played++;
    if (won) {
      stats.wins++;
      stats.guessTotal += guesses.length;
      const yesterday = utcDateString(new Date(Date.now() - 86400000));
      stats.currentStreak = stats.lastWinDate === yesterday ? stats.currentStreak + 1 : 1;
      stats.bestStreak = Math.max(stats.bestStreak,stats.currentStreak);
      stats.lastWinDate = today;
    } else {
      stats.currentStreak = 0;
    }
    stats.lastPlayedDate = today;
    stats.completed[today] = {won,guesses:guesses.length};
    saveStats();
  }
  const panel = $("result-panel");
  panel.hidden = false;
  panel.innerHTML = won
    ? `<div class="section-kicker">RIFF MASTERED</div><h3>YOU FOUND THEM.</h3><p>The band was <strong class="answer-name">${escapeHtml(dailyBand.name)}</strong>. You got it in ${guesses.length} ${guesses.length===1?"guess":"guesses"}.</p>${answerDetails()}${resultActions()}`
    : `<div class="section-kicker">THE PIT CLAIMS ANOTHER</div><h3>OUT OF GUESSES.</h3><p>The mystery band was <strong class="answer-name">${escapeHtml(dailyBand.name)}</strong>.</p>${answerDetails()}${resultActions()}`;
  const copyButton = $("copy-result");
  if (copyButton) copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      copyButton.textContent = "COPIED!";
      setTimeout(() => copyButton.textContent = "COPY RESULT ↗", 1800);
    } catch {
      window.prompt("Copy your MetalDle result:", buildShareText());
    }
  });
  updateStats();
}
function answerDetails() {
  return `<p>${dailyBand.debut_year} · ${escapeHtml(dailyBand.subgenre)} · ${escapeHtml(dailyBand.country)} · ${dailyBand.active?"Active":"Disbanded"}<br><span style="color:#8d8993">First qualifying release: ${escapeHtml(dailyBand.first_release)}</span></p>`;
}
function resultActions() {
  return `<div class="result-actions"><button class="primary-button" id="copy-result">COPY RESULT ↗</button></div>`;
}
function buildShareText() {
  const today = utcDateString();
  const rows = guesses.map(g => {
    const c = compareGuess(g,dailyBand);
    return [c.year,c.genre,c.country,c.status].map(x => ({green:"🟩",yellow:"🟨",black:"⬛"}[x])).join("");
  }).join("\n");
  const won = guesses.some(g=>isExactWin(g,dailyBand));
  return `METALDLE #${Math.max(1,dayNumber(today)+1)} ${won?guesses.length:"X"}/${MAX_GUESSES}\n${rows}`;
}
function updateStats() {
  const rate = stats.played ? Math.round(stats.wins / stats.played * 100) : 0;
  $("stat-played").textContent = stats.played;
  $("stat-winrate").textContent = `${rate}%`;
  $("stat-streak").textContent = stats.currentStreak;
  $("modal-played").textContent = stats.played;
  $("modal-wins").textContent = stats.wins;
  $("modal-winrate").textContent = `${rate}%`;
  $("modal-streak").textContent = stats.currentStreak;
  $("modal-best").textContent = stats.bestStreak;
  $("modal-average").textContent = stats.wins ? (stats.guessTotal / stats.wins).toFixed(1) : "—";
}
function openDialog(id) { $(id).showModal(); }
function wireDialogs() {
  $("help-button").addEventListener("click",()=>openDialog("help-dialog"));
  $("stats-button").addEventListener("click",()=>openDialog("stats-dialog"));
  $("view-stats").addEventListener("click",()=>openDialog("stats-dialog"));
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close()}));
  $("share-stats").addEventListener("click",copyResults);
}
async function copyResults() {
  const text = buildShareText();
  try {
    await navigator.clipboard.writeText(text);
    $("share-stats").textContent = "COPIED!";
    setTimeout(()=>$("share-stats").textContent="COPY MY RESULTS ↗",1800);
  } catch {
    window.prompt("Copy your MetalDle result:",text);
  }
}
function restoreToday() {
  const today = utcDateString();
  const saved = stats.completed[today];
  if (!saved) return false;
  // We retain a simple completed-state marker. The answer is still revealed on refresh.
  gameOver = true;
  $("band-input").disabled = true;
  $("guess-button").disabled = true;
  $("result-panel").hidden = false;
  $("result-panel").innerHTML = `<div class="section-kicker">TODAY'S CHALLENGE COMPLETE</div><h3>COME BACK TOMORROW.</h3><p>Today's answer was <strong class="answer-name">${escapeHtml(dailyBand.name)}</strong>.</p>${answerDetails()}`;
  $("attempt-count").textContent = saved.guesses;
  $("progress-fill").style.width = `${saved.guesses/MAX_GUESSES*100}%`;
  return true;
}
async function init() {
  try {
    const response = await fetch("bands.json");
    if (!response.ok) throw new Error("Could not load bands.json");
    bands = await response.json();
    if (!Array.isArray(bands) || bands.length < 2) throw new Error("Band database needs at least two bands.");
    dailyBand = chooseDailyBand(utcDateString());
    $("puzzle-number").textContent = `PUZZLE ${Math.max(1,dayNumber(utcDateString())+1)}`;
    $("today-label").textContent = new Date().toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"}).toUpperCase();
    $("band-input").addEventListener("input",e=>{selectedBand=null;renderSuggestions(e.target.value)});
    $("band-input").addEventListener("keydown",e=>{
      const items=[...$("suggestions").querySelectorAll(".suggestion")];
      if(e.key==="ArrowDown" && items.length){e.preventDefault();activeSuggestion=(activeSuggestion+1)%items.length;items.forEach((b,i)=>b.classList.toggle("active",i===activeSuggestion));}
      else if(e.key==="ArrowUp" && items.length){e.preventDefault();activeSuggestion=(activeSuggestion-1+items.length)%items.length;items.forEach((b,i)=>b.classList.toggle("active",i===activeSuggestion));}
      else if(e.key==="Enter"){e.preventDefault();if(activeSuggestion>=0 && items[activeSuggestion])chooseBand(items[activeSuggestion].dataset.name);else submitGuess();}
      else if(e.key==="Escape") $("suggestions").hidden=true;
    });
    $("guess-button").addEventListener("click",submitGuess);
    $("band-input").addEventListener("focus",()=>{if($("band-input").value)renderSuggestions($("band-input").value)});
    document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("suggestions").hidden=true});
    wireDialogs();
    updateStats();
    restoreToday();
  } catch (error) {
    console.error(error);
    $("guess-history").innerHTML = `<div class="empty-state"><strong>DATABASE ERROR</strong><span>Make sure bands.json is in the same folder as index.html.</span></div>`;
    $("band-input").disabled=true;
    $("guess-button").disabled=true;
  }
}
init();
