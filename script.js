/* ---------- Scroll reveal ---------- */
document.querySelectorAll('.section, .story-card, .qcard, .stat, .polaroid, .finale-photo')
  .forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- Message Wall ---------- */
const STORAGE_KEY = 'jivanu_sunil_wall_v1';

const prefilled = [];

const form = document.getElementById('msg-form');
const grid = document.getElementById('wall-grid');

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function render() {
  const user = load();
  const all = [...prefilled, ...user];
  if (!all.length) {
    grid.innerHTML = `<p class="wall-empty">No messages yet — be the first to post something legendary for Sunil! 👆</p>`;
    return;
  }
  grid.innerHTML = all.map(m => `
    <div class="msg${m.pinned ? ' pinned' : ''}">
      <p class="m-text">${esc(m.text)}</p>
      <span class="m-who">${esc(m.name)}</span>
      ${m.role ? `<span class="m-role">${esc(m.role)}</span>` : ''}
    </div>`).join('');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('msg-name').value.trim();
  const role = document.getElementById('msg-role').value.trim();
  const text = document.getElementById('msg-text').value.trim();
  if (!name || !text) return;

  const list = load();
  list.push({ name, role, text });
  save(list);
  form.reset();
  render();

  // jump to the newest message
  const msgs = grid.querySelectorAll('.msg');
  msgs[msgs.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

render();

/* ================================================================
   CONFETTI (thumbs-up + Thums Up rain)
================================================================ */
const confCanvas = document.getElementById('confetti');
const confCtx = confCanvas.getContext('2d');
let confParticles = [];
function sizeConf(){ confCanvas.width = innerWidth; confCanvas.height = innerHeight; }
sizeConf(); addEventListener('resize', sizeConf);

function burstConfetti(x, y, n = 40){
  const emojis = ['👍','🥤','🎉','⭐','🔥','🏎️'];
  for(let i=0;i<n;i++){
    confParticles.push({
      x, y,
      vx:(Math.random()-0.5)*10,
      vy:-(Math.random()*9+4),
      g:0.28,
      life:1,
      rot:Math.random()*6.28,
      vr:(Math.random()-0.5)*0.3,
      s:Math.random()*16+16,
      e:emojis[(Math.random()*emojis.length)|0]
    });
  }
  if(!confRunning){ confRunning = true; requestAnimationFrame(confLoop); }
}
let confRunning = false;
function confLoop(){
  confCtx.clearRect(0,0,confCanvas.width,confCanvas.height);
  confParticles.forEach(p=>{
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.008;
    confCtx.save();
    confCtx.globalAlpha = Math.max(0,p.life);
    confCtx.translate(p.x,p.y); confCtx.rotate(p.rot);
    confCtx.font = p.s+'px serif'; confCtx.textAlign='center'; confCtx.textBaseline='middle';
    confCtx.fillText(p.e,0,0);
    confCtx.restore();
  });
  confParticles = confParticles.filter(p=>p.life>0 && p.y<confCanvas.height+40);
  if(confParticles.length){ requestAnimationFrame(confLoop); } else { confRunning = false; }
}

/* ================================================================
   GAME 1 — THUMS UP CATCH: BANGALORE DRIFT
================================================================ */
(function(){
  const canvas = document.getElementById('catch-game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const scoreEl = document.getElementById('cg-score');
  const timeEl  = document.getElementById('cg-time');
  const bestEl  = document.getElementById('cg-best');
  const overlay = document.getElementById('cg-overlay');
  const startBtn= document.getElementById('cg-start');

  const BEST_KEY = 'jivanu_catch_best';
  bestEl.textContent = (+localStorage.getItem(BEST_KEY) || 0);

  let carX = W/2, score = 0, timeLeft = 30, items = [], running = false;
  let spawnT = 0, lastTs = 0, timerAcc = 0;
  const CAR_W = 96, CAR_Y = H - 64;

  function moveTo(clientX){
    const r = canvas.getBoundingClientRect();
    carX = (clientX - r.left) * (W / r.width);
    carX = Math.max(CAR_W/2, Math.min(W-CAR_W/2, carX));
  }
  canvas.addEventListener('mousemove', e=>{ if(running) moveTo(e.clientX); });
  canvas.addEventListener('touchmove', e=>{ if(running){ moveTo(e.touches[0].clientX); e.preventDefault(); } }, {passive:false});
  addEventListener('keydown', e=>{
    if(!running) return;
    if(e.key==='ArrowLeft')  carX = Math.max(CAR_W/2, carX-42);
    if(e.key==='ArrowRight') carX = Math.min(W-CAR_W/2, carX+42);
  });

  function spawn(){
    const gym = Math.random() < 0.24;
    items.push({ x: Math.random()*(W-60)+30, y:-30, vy: Math.random()*2.2 + 3 + score*0.03, gym, e: gym?'🏋️':'🥤', r:22 });
  }
  function reset(){ carX=W/2; score=0; timeLeft=30; items=[]; spawnT=0; timerAcc=0; }

  function end(){
    running = false;
    const best = +localStorage.getItem(BEST_KEY) || 0;
    if(score > best){ localStorage.setItem(BEST_KEY, score); bestEl.textContent = score; }
    let verdict;
    if(score>=25) verdict = "🏆 Fast & Furious 12: certified. Sunil-level driving.";
    else if(score>=15) verdict = "🔥 Solid drift! Thums Up national reserves saved.";
    else if(score>=7) verdict = "😎 Not bad. Multiple lifelines still intact.";
    else verdict = "😅 Gira hua insaan detected. Try again!";
    overlay.innerHTML = `<div class="cg-result">Time up! You caught <b>${score}</b> Thums Ups.<br>${verdict}</div>
                         <button id="cg-again" class="game-btn">↻ Drift Again</button>`;
    overlay.classList.remove('hide');
    document.getElementById('cg-again').addEventListener('click', begin);
    const r = canvas.getBoundingClientRect();
    burstConfetti(r.left + r.width/2, r.top + r.height/3, 50);
  }

  let flash='', flashT=0;
  function loop(ts){
    if(!running) return;
    const dt = Math.min(40, ts - lastTs || 16); lastTs = ts;
    timerAcc += dt;
    if(timerAcc >= 1000){ timerAcc -= 1000; timeLeft--; timeEl.textContent = Math.max(0,timeLeft); if(timeLeft<=0){ draw(); return end(); } }
    spawnT += dt;
    const interval = Math.max(360, 780 - score*12);
    if(spawnT > interval){ spawnT = 0; spawn(); }
    for(let i=items.length-1;i>=0;i--){
      const it = items[i];
      it.y += it.vy * (dt/16);
      if(it.y > CAR_Y-26 && it.y < CAR_Y+30 && Math.abs(it.x-carX) < CAR_W/2 + it.r){
        if(it.gym){ score = Math.max(0, score-3); flash='rgba(226,35,26,.35)'; }
        else { score += 1; flash='rgba(31,174,82,.30)'; }
        scoreEl.textContent = score; items.splice(i,1); flashT = 8; continue;
      }
      if(it.y > H+30) items.splice(i,1);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function draw(){
    ctx.fillStyle = '#08194f'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 6; ctx.setLineDash([26,26]);
    for(let x=W/4;x<W;x+=W/4){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    items.forEach(it=>{ ctx.font='38px serif'; ctx.fillText(it.e, it.x, it.y); });
    ctx.font='64px serif'; ctx.fillText('🏎️', carX, CAR_Y);
    if(flashT>0){ ctx.fillStyle=flash; ctx.fillRect(0,0,W,H); flashT--; }
  }

  function begin(){
    reset(); scoreEl.textContent = 0; timeEl.textContent = 30;
    overlay.classList.add('hide'); running = true; lastTs = performance.now();
    requestAnimationFrame(loop);
  }
  startBtn.addEventListener('click', begin);
  draw();
})();

/* ================================================================
   GAME 2 — SUNIL QUIZ
================================================================ */
(function(){
  const body = document.getElementById('quiz-body');
  const prog = document.getElementById('quiz-progress');
  const restart = document.getElementById('quiz-restart');

  const Q = [
    { q:"What is officially the National Drink of Jivanu?", opts:["Filter Coffee","Thums Up","Green Tea","Sunil's tears of joy"], a:1 },
    { q:"Complete the legendary line: 'Karanveer to ___ insaan hai.'", opts:["gira hua","padha likha","seedha saadha","bahut tez"], a:0 },
    { q:"What did Sunil shout on the adventure-park drop swing?", opts:["Yeehaw!","Om Shanti","MUMMI!","Thums Up!"], a:2 },
    { q:"Sunil's honorary doctorate is from…", opts:["IIT Bangalore","Haryana Inst. of Medical Sciences & Wrestling","Hogwarts","Bangalore Driving School"], a:1 },
    { q:"His most reliable 3-year-long promise?", opts:["Joining the gym next month","Quitting Thums Up","Driving slowly","Taking a day off"], a:0 }
  ];

  let idx = 0, score = 0;

  function renderQ(){
    const item = Q[idx];
    prog.textContent = `Question ${idx+1} / ${Q.length}`;
    restart.hidden = true;
    body.innerHTML = `<div class="quiz-q">${item.q}</div>
      <div class="quiz-opts">${item.opts.map((o,i)=>`<button class="quiz-opt" data-i="${i}">${o}</button>`).join('')}</div>`;
    body.querySelectorAll('.quiz-opt').forEach(b=> b.addEventListener('click', ()=>choose(b, item.a)) );
  }

  function choose(btn, correct){
    const chosen = +btn.dataset.i;
    body.querySelectorAll('.quiz-opt').forEach(b=>{ b.disabled = true; if(+b.dataset.i === correct) b.classList.add('correct'); });
    if(chosen === correct) score++; else btn.classList.add('wrong');
    setTimeout(()=>{ idx++; (idx < Q.length) ? renderQ() : finish(); }, 850);
  }

  function finish(){
    prog.textContent = 'Done!';
    let title, sub;
    if(score===5){ title="🏆 Certified Jivanu Legend"; sub=""; setTimeout(()=>burstConfetti(innerWidth/2, innerHeight/2, 60),100); }
    else if(score>=3){ title="😎 Solid Team Member"; sub="You've clearly survived a few of his drives."; }
    else { title="😅 New Joiner Energy"; sub="Go buy the man a Thums Up and get to know him. Quick — it's his last day!"; }
    body.innerHTML = `<div class="quiz-result">
        <div class="score">${score}/5</div>
        <div class="verdict">${title}</div>
        ${sub ? `<div class="verdict-sub">${sub}</div>` : ''}
      </div>`;
    restart.hidden = false;
  }

  restart.addEventListener('click', ()=>{ idx=0; score=0; renderQ(); });
  renderQ();
})();
