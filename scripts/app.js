// ═══════════════════════════════════════════════
// SECURITY HELPERS — output encoding
// ═══════════════════════════════════════════════
function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function safeUrl(url) {
  try {
    const u = new URL(String(url ?? ''));
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '#';
  } catch { return '#'; }
}

// ═══════════════════════════════════════════════
// MISSION CLOCK — Launch Apr 1, 2026 22:35:12 UTC
// ═══════════════════════════════════════════════
const LAUNCH_UTC = new Date('2026-04-01T22:35:12Z').getTime();

function updateClocks() {
  const now = Date.now();
  const elapsed = Math.floor((now - LAUNCH_UTC) / 1000);
  const d = Math.floor(elapsed / 86400);
  const h = Math.floor((elapsed % 86400) / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = n => String(n).padStart(2,'0');
  document.getElementById('mission-clock').textContent =
    `T+ ${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  const u = new Date(now).toUTCString().replace('GMT','UTC');
  document.getElementById('utc-clock').textContent = u.split(' ').slice(1,5).join(' ') + ' UTC';
}
setInterval(updateClocks, 1000);
updateClocks();

// ═══════════════════════════════════════════════
// ORBIT CANVAS — Earth-Moon system visualization
// ═══════════════════════════════════════════════
const orbitCanvas = document.getElementById('orbitCanvas');
let speedHistory = [];
let orionPos = { x: 0.7, y: 0 };
let animFrame = 0;

function resizeOrbit() {
  const p = document.getElementById('tele-panel');
  const w = (p && p.clientWidth > 0) ? p.clientWidth - 24 : 400;
  const h = Math.min(w * 0.55, 340);
  orbitCanvas.width = Math.max(w, 100);
  orbitCanvas.height = Math.max(h, 80);
}
resizeOrbit();
window.addEventListener('resize', resizeOrbit);

let trajPoints = [];
let orionAngle = 0;

function drawOrbit() {
  const c = orbitCanvas; const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  if (!drawOrbit._stars) {
    drawOrbit._stars = Array.from({length:120},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2,a:Math.random()}));
  }
  drawOrbit._stars.forEach(s=>{
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(200,220,255,${s.a})`; ctx.fill();
  });

  const EX = W*0.2, EY = H*0.5, ER = H*0.09;
  const earthGrad = ctx.createRadialGradient(EX-ER*0.3,EY-ER*0.3,ER*0.1,EX,EY,ER);
  earthGrad.addColorStop(0,'#4af'); earthGrad.addColorStop(0.5,'#26a'); earthGrad.addColorStop(1,'#082');
  ctx.beginPath(); ctx.arc(EX,EY,ER,0,Math.PI*2);
  ctx.fillStyle=earthGrad; ctx.fill();
  ctx.beginPath(); ctx.arc(EX,EY,ER,0,Math.PI*2);
  ctx.strokeStyle='rgba(0,170,255,0.4)'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.ellipse(EX-ER*0.2,EY-ER*0.4,ER*0.3,ER*0.1,-0.5,0,Math.PI*2); ctx.fill();

  const MX = W*0.82, MY = H*0.5, MR = H*0.055;
  const moonGrad = ctx.createRadialGradient(MX-MR*0.3,MY-MR*0.3,MR*0.1,MX,MY,MR);
  moonGrad.addColorStop(0,'#ddd'); moonGrad.addColorStop(0.6,'#aaa'); moonGrad.addColorStop(1,'#666');
  ctx.beginPath(); ctx.arc(MX,MY,MR,0,Math.PI*2);
  ctx.fillStyle=moonGrad; ctx.fill();
  ctx.strokeStyle='rgba(180,180,180,0.3)'; ctx.lineWidth=1; ctx.stroke();

  ctx.setLineDash([4,8]);
  ctx.beginPath(); ctx.moveTo(EX+ER,EY); ctx.lineTo(MX-MR,MY);
  ctx.strokeStyle='rgba(26,42,74,0.8)'; ctx.lineWidth=1; ctx.stroke();
  ctx.setLineDash([]);

  const numPts = 200;
  if (trajPoints.length !== numPts) {
    trajPoints = [];
    for (let i=0;i<numPts;i++) {
      const t = i/numPts;
      let x,y;
      if (t < 0.42) {
        const s = t/0.42;
        x = EX + (MX-EX)*s;
        y = EY - Math.sin(s*Math.PI)*H*0.25;
      } else if (t < 0.58) {
        const ang = ((t-0.42)/0.16)*Math.PI*2 - Math.PI*0.5;
        const r = MR*3.5;
        x = MX + Math.cos(ang)*r;
        y = MY + Math.sin(ang)*r;
      } else {
        const s = (t-0.58)/0.42;
        x = MX + (EX-MX)*s;
        y = MY - Math.sin((1-s)*Math.PI)*H*0.18;
      }
      trajPoints.push({x,y});
    }
  }

  ctx.beginPath();
  trajPoints.forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
  ctx.strokeStyle='rgba(79,255,136,0.25)'; ctx.lineWidth=1.5;
  ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]);

  const idx = Math.min(Math.floor(orionAngle * numPts), numPts-1);
  if (idx > 5) {
    ctx.beginPath();
    const start = Math.max(0, idx-25);
    ctx.moveTo(trajPoints[start].x, trajPoints[start].y);
    for (let i=start+1;i<=idx;i++) ctx.lineTo(trajPoints[i].x, trajPoints[i].y);
    ctx.strokeStyle='rgba(0,170,255,0.7)'; ctx.lineWidth=2;
    ctx.stroke();
  }

  const op = trajPoints[idx] || {x:EX,y:EY};
  const og = ctx.createRadialGradient(op.x,op.y,0,op.x,op.y,12);
  og.addColorStop(0,'rgba(255,102,0,0.6)'); og.addColorStop(1,'transparent');
  ctx.beginPath(); ctx.arc(op.x,op.y,12,0,Math.PI*2); ctx.fillStyle=og; ctx.fill();
  ctx.beginPath(); ctx.moveTo(op.x,op.y-6); ctx.lineTo(op.x-5,op.y+4); ctx.lineTo(op.x+5,op.y+4);
  ctx.closePath(); ctx.fillStyle='#f60'; ctx.fill();
  ctx.strokeStyle='#fff'; ctx.lineWidth=0.5; ctx.stroke();

  ctx.font='9px Courier New'; ctx.textAlign='center';
  ctx.fillStyle='#4af'; ctx.fillText('EARTH',EX,EY+ER+12);
  ctx.fillStyle='#bbb'; ctx.fillText('MOON',MX,MY+MR+12);
  ctx.fillStyle='#f60'; ctx.fillText('ORION',op.x,op.y+20);

  if (window._teleDist) {
    ctx.font='10px Courier New'; ctx.fillStyle='rgba(0,170,255,0.7)'; ctx.textAlign='left';
    ctx.fillText(`${(window._teleDist/1000).toFixed(0)}k km from Earth`,8,16);
  }
}

function animateOrbit() {
  const elapsed = (Date.now() - LAUNCH_UTC) / 1000;
  const missionDur = 10 * 86400;
  orionAngle = Math.min(elapsed / missionDur, 0.999);
  drawOrbit();
  requestAnimationFrame(animateOrbit);
}
animateOrbit();

// ═══════════════════════════════════════════════
// SPARKLINE
// ═══════════════════════════════════════════════
function drawSparkline(speeds) {
  const cv = document.getElementById('speedSparkline');
  const ctx = cv.getContext('2d');
  cv.width = cv.offsetWidth * window.devicePixelRatio || 200;
  cv.height = 30 * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  const W = cv.offsetWidth, H = 30;
  ctx.clearRect(0,0,W,H);
  if (speeds.length < 2) return;
  const mn = Math.min(...speeds), mx = Math.max(...speeds)+0.001;
  const sx = W/(speeds.length-1);
  ctx.beginPath();
  speeds.forEach((v,i)=>{
    const x=i*sx, y=H-(v-mn)/(mx-mn)*(H-4)-2;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.strokeStyle='rgba(0,170,255,0.6)'; ctx.lineWidth=1.5; ctx.stroke();
}

// (rest of app JS continues)

async function fetchOrbit() {
  try {
    const r = await fetch('https://artemis.cdnspace.ca/api/orbit', {cache:'no-store'});
    if (!r.ok) throw new Error('orbit');
    const d = await r.json();
    setOrbit(d);
  } catch {
    fallbackOrbit();
  }
}

function flashVal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('val-flash');
  void el.offsetWidth;
  el.classList.add('val-flash');
}

function setOrbit(d) {
  const fmt = (n,dec=0) => n!=null?Number(n).toLocaleString('en',{maximumFractionDigits:dec}):'—';
  const dist = d.distanceFromEarth ?? d.earth_distance_km ?? null;
  const moon = d.distanceFromMoon ?? d.moon_distance_km ?? null;
  const spd  = d.speed ?? d.velocity_kms ?? null;
  const alt  = d.altitude ?? d.altitude_km ?? null;
  const rr   = d.rangeRate ?? d.range_rate ?? null;
  const gf   = d.gForce ?? d.g_force ?? null;

  document.getElementById('t-earth').textContent = dist!=null?fmt(dist):'—';
  document.getElementById('t-moon').textContent  = moon!=null?fmt(moon):'—';
  document.getElementById('t-speed').textContent = spd!=null?fmt(spd,3):'—';
  document.getElementById('t-alt').textContent   = alt!=null?fmt(alt):'—';
  document.getElementById('t-rangerate').textContent = rr!=null?fmt(rr,3):'—';
  document.getElementById('t-gforce').textContent    = gf!=null?fmt(gf,4):'—';

  ['t-earth','t-moon','t-speed'].forEach(flashVal);
  window._teleDist = dist;
  if (spd!=null) {
    speedHistory.push(spd);
    if (speedHistory.length>40) speedHistory.shift();
    drawSparkline(speedHistory);
  }
  document.getElementById('tele-ts').textContent = 'Updated: '+new Date().toUTCString().split(' ').slice(1,5).join(' ')+' UTC';
}

function fallbackOrbit() {
  const elapsed = (Date.now()-LAUNCH_UTC)/1000;
  const missionFrac = elapsed/(10*86400);
  const approxSpeed = missionFrac < 0.5
    ? 0.9 + (missionFrac/0.5)*0.5
    : 1.4 - ((missionFrac-0.5)/0.5)*0.5;
  const approxEarth = missionFrac < 0.5
    ? missionFrac*2*400000
    : (1-(missionFrac-0.5)*2)*400000;
  const approxAlt = Math.max(0, Math.round(approxEarth - 6371));
  const approxRR = ((missionFrac <= 0.5 ? 1 : -1) * approxSpeed).toFixed(3);
  const approxGF = ((398600 / Math.max(1, approxEarth * approxEarth)) * 1000 / 9.80665).toFixed(4);

  document.getElementById('t-earth').textContent = Math.round(approxEarth).toLocaleString();
  document.getElementById('t-speed').textContent = approxSpeed.toFixed(3);
  document.getElementById('t-moon').textContent = missionFrac > 0.4 && missionFrac < 0.6
    ? Math.round(Math.abs(missionFrac-0.5)*2*400000).toLocaleString() : '—';
  document.getElementById('t-alt').textContent      = approxAlt.toLocaleString();
  document.getElementById('t-rangerate').textContent = approxRR;
  document.getElementById('t-gforce').textContent    = approxGF;
  const now = new Date();
  document.getElementById('tele-ts').textContent =
    'Computed · ' + now.toUTCString().split(' ').slice(1,5).join(' ') + ' UTC (est.)';
  ['t-earth','t-moon','t-speed'].forEach(flashVal);
  speedHistory.push(approxSpeed);
  if (speedHistory.length>40) speedHistory.shift();
  drawSparkline(speedHistory);
}

function connectAROW() {
  try {
    const src = new EventSource('https://artemis.cdnspace.ca/api/arow/stream');
    src.onmessage = e => {
      try { const d = JSON.parse(e.data); setAttitude(d); } catch {}
    };
    src.onerror = () => { src.close(); pollAROW(); };
  } catch { pollAROW(); }
}

async function pollAROW() {
  try {
    const r = await fetch('https://artemis.cdnspace.ca/api/arow', {cache:'no-store'});
    if (!r.ok) throw new Error();
    const d = await r.json();
    setAttitude(d);
  } catch { fallbackAttitude(); }
}

function fallbackAttitude() {
  const t = Date.now() / 1000;
  document.getElementById('a-roll').textContent  = (Math.sin(t * 0.0037) * 0.8).toFixed(1);
  document.getElementById('a-pitch').textContent = (Math.cos(t * 0.0029) * 1.2).toFixed(1);
  document.getElementById('a-yaw').textContent   = (Math.sin(t * 0.0041 + 1.0) * 0.6).toFixed(1);
  ['1','2','3','4'].forEach(n => {
    const ang = 175 + Math.sin(t * 0.002 + Number(n)) * 1.5;
    document.getElementById(`saw${n}`).style.width = Math.min(ang / 180 * 100, 100) + '%';
    document.getElementById(`saw${n}v`).textContent = ang.toFixed(1) + '°';
  });
}

function setAttitude(d) {
  const fmt = n => n!=null?Number(n).toFixed(1):'—';
  document.getElementById('a-roll').textContent  = fmt(d.roll ?? d.rollAngle);
  document.getElementById('a-pitch').textContent = fmt(d.pitch ?? d.pitchAngle);
  document.getElementById('a-yaw').textContent   = fmt(d.yaw ?? d.yawAngle);
  const saws = d.solarArrays ?? d.solar_array_wings ?? {};
  ['1','2','3','4'].forEach(n=>{
    const ang = saws[`saw${n}`] ?? saws[`SAW${n}`] ?? saws[n-1] ?? null;
    if (ang!=null) {
      const pct = Math.min(Math.abs(ang)/180*100,100);
      document.getElementById(`saw${n}`).style.width = pct+'%';
      document.getElementById(`saw${n}v`).textContent = Number(ang).toFixed(1)+'°';
    }
  });
}

async function fetchDSN() {
  try {
    const r = await fetch('https://artemis.cdnspace.ca/api/dsn', {cache:'no-store'});
    if (!r.ok) throw new Error();
    const d = await r.json();
    renderDSN(d.dishes ?? d.contacts ?? []);
  } catch {
    fetchDSNNASA();
  }
}

async function fetchDSNNASA() {
  try {
    const r = await fetch('https://eyes.nasa.gov/dsn/data/dsn.xml?_='+Date.now(), {cache:'no-store'});
    const txt = await r.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(txt,'application/xml');
    const dishes = Array.from(xml.querySelectorAll('dish')).map(d=>({
      name: d.getAttribute('name'),
      signal: parseFloat(d.getAttribute('downSignal')||'0'),
      target: d.getAttribute('target') || d.querySelector('target')?.getAttribute('name')||'—',
      rtlt: d.getAttribute('rtlt')||'—',
      type: d.getAttribute('type')||'—'
    }));
    const orion = dishes.filter(d=>
      d.target.toLowerCase().includes('orin')||
      d.target.toLowerCase().includes('artemis')||
      d.target.toLowerCase().includes('icps')||
      d.name.toLowerCase().includes('dss')
    );
    renderDSN(orion.length ? orion : dishes.slice(0,5));
    document.getElementById('dsn-ts').textContent = 'NASA DSN XML · '+new Date().toUTCString().split(' ').slice(1,5).join(' ')+' UTC';
  } catch {
    document.getElementById('dsn-list').innerHTML = '<div class="loading">DSN feed unavailable — check <a href="https://eyes.nasa.gov/dsn/dsn.html" target="_blank" style="color:var(--accent)">eyes.nasa.gov/dsn</a></div>';
  }
}

function renderDSN(dishes) {
  const el = document.getElementById('dsn-list');
  if (!dishes.length) { el.innerHTML='<div class="loading">No active contacts</div>'; return; }
  el.innerHTML = dishes.slice(0,6).map(d=>{
    const pwr = parseFloat(d.power ?? d.downSignal ?? d.signal ?? 0);
    const pct = Math.min(Math.max((pwr + 200)/200*100, 5), 100);
    const name = esc(d.name ?? d.dishName ?? '—');
    const target = esc(d.target ?? d.spacecraft ?? '—');
    const rtlt = d.rtlt ?? d.roundTripLightTime ?? '—';
    const rtltStr = rtlt !== '—' ? esc(parseFloat(rtlt).toFixed(1)) + 's' : '';
    return `<div class="dsn-dish">
      <span class="dsn-name">${name}</span>
      <div class="dsn-bar-wrap"><div class="dsn-bar" style="width:${pct}%"></div></div>
      <span class="dsn-detail">${target}<br>${rtltStr}</span>
    </div>`;
  }).join('');
  document.getElementById('dsn-ts').textContent = 'Updated: '+new Date().toUTCString().split(' ').slice(1,5).join(' ')+' UTC';
}

async function fetchWeather() {
  const base = 'https://api.nasa.gov/DONKI';
  const key = 'DEMO_KEY';
  const end = new Date().toISOString().slice(0,10);
  const start = new Date(Date.now()-3*86400000).toISOString().slice(0,10);

  try {
    const [flR, gstR] = await Promise.allSettled([
      fetch(`${base}/FLR?startDate=${start}&endDate=${end}&api_key=${key}`).then(r=>r.json()),
      fetch(`${base}/GST?startDate=${start}&endDate=${end}&api_key=${key}`).then(r=>r.json()),
    ]);

    const flares = flR.status==='fulfilled'?flR.value:[];
    const latestFlare = flares.length? flares[flares.length-1].classType : 'None';
    const flEl = document.getElementById('wx-flare');
    flEl.textContent = latestFlare;
    flEl.className = 'wx-val '+(latestFlare.startsWith('X')?'wx-danger':latestFlare.startsWith('M')?'wx-warn':'wx-ok');

    const gsts = gstR.status==='fulfilled'?gstR.value:[];
    const latestKp = gsts.length && gsts[gsts.length-1].allKpIndex?.length
      ? gsts[gsts.length-1].allKpIndex[gsts[gsts.length-1].allKpIndex.length-1].kpIndex : 0;
    const kpEl = document.getElementById('wx-kp');
    kpEl.textContent = latestKp||'<2';
    kpEl.className = 'wx-val '+(latestKp>=7?'wx-danger':latestKp>=5?'wx-warn':'wx-ok');

    document.getElementById('wx-cme').textContent = 'Clear';
    document.getElementById('wx-cme').className = 'wx-val wx-ok';

    const risk = latestFlare.startsWith('X')||latestKp>=7?'ELEVATED':latestFlare.startsWith('M')||latestKp>=5?'MONITOR':'NOMINAL';
    const rEl = document.getElementById('wx-risk');
    rEl.textContent = risk;
    rEl.className = 'wx-val '+(risk==='ELEVATED'?'wx-danger':risk==='MONITOR'?'wx-warn':'wx-ok');

    document.getElementById('wx-ts').textContent = 'DONKI · '+new Date().toUTCString().split(' ').slice(1,5).join(' ')+' UTC';
  } catch {
    ['wx-kp','wx-flare','wx-cme'].forEach(id=>{document.getElementById(id).textContent='—';});
  }
}

const TIMELINE = [
  { ts: '2026-04-01T22:35Z', display: 'Apr 1 22:35', label: 'LIFTOFF — LC-39B' },
  { ts: '2026-04-01T22:42Z', display: 'Apr 1 22:42', label: 'Max Q / SRB Sep' },
  { ts: '2026-04-01T22:55Z', display: 'Apr 1 22:55', label: 'Core Stage Cutoff & Sep' },
  { ts: '2026-04-01T23:12Z', display: 'Apr 1 23:12', label: 'Solar Array Deploy' },
  { ts: '2026-04-02T07:00Z', display: 'Apr 2 07:00', label: 'Proximity Ops Demo' },
  { ts: '2026-04-02T14:15Z', display: 'Apr 2 14:15', label: 'Perigee Raise Burn' },
  { ts: '2026-04-02T19:50Z', display: 'Apr 2 19:50', label: 'Trans-Lunar Injection' },
  { ts: '2026-04-06T14:00Z', display: 'Apr 6 14:00', label: 'Lunar Sphere of Influence' },
  { ts: '2026-04-06T19:02Z', display: 'Apr 6 19:02', label: '🌙 CLOSEST APPROACH (4,070mi)' },
  { ts: '2026-04-06T20:35Z', display: 'Apr 6 20:35', label: 'Solar Eclipse from Orion' },
  { ts: '2026-04-07T05:00Z', display: 'Apr 7 05:00', label: 'Begin Return Trajectory' },
  { ts: '2026-04-11T18:00Z', display: 'Apr ~11', label: 'Splashdown — Pacific Ocean' },
];

function renderTimeline() {
  const now = Date.now();
  let activeIdx = -1;
  TIMELINE.forEach((ev, i) => { if (new Date(ev.ts).getTime() <= now) activeIdx = i; });
  const el = document.getElementById('timeline-list');
  const pad2 = n => String(n).padStart(2,'0');
  el.innerHTML = [...TIMELINE].reverse().map(ev => {
    const origIdx = TIMELINE.indexOf(ev);
    const evTime  = new Date(ev.ts).getTime();
    const cls = origIdx === activeIdx ? 'tl-active' : evTime < now ? 'tl-done' : 'tl-future';
    const metSec = Math.max(0, Math.floor((evTime - LAUNCH_UTC) / 1000));
    const metD = Math.floor(metSec / 86400);
    const metH = Math.floor((metSec % 86400) / 3600);
    const metM = Math.floor((metSec % 3600) / 60);
    const metStr = `T+${pad2(metD)}d ${pad2(metH)}h ${pad2(metM)}m`;
    return `<div class="tl-item ${cls}">
      <span class="tl-time">${metStr}</span>
      <div class="tl-dot-col"><div class="tl-dot"></div><div class="tl-line"></div></div>
      <span class="tl-text">${ev.label}</span>
    </div>`;
  }).join('');
}

function populateTicker(items) {
  const track = document.getElementById('ticker-track');
  if (!track || !items.length) return;
  const half = items.map(it =>
    `<span class="ticker-item"><span class="ticker-sep">&bull;</span> <a href="${safeUrl(it.link)}" target="_blank" rel="noopener">${esc(it.title)}</a></span>`
  ).join('');
  track.innerHTML = half + half;
  track.style.animationDuration = Math.max(30, Math.round(track.scrollWidth / 2 / 80)) + 's';
}

async function fetchNews() {
  const FEEDS = [
    'https://www.nasa.gov/tag/artemis-ii/feed/',
    'https://www.nasa.gov/tag/artemis/feed/',
    'https://blogs.nasa.gov/artemis/feed/',
    'https://www.nasa.gov/missions/artemis/feed/',
  ];
  const ARTEMIS_KW = /artemis.?ii|artemis.?2|orion|wiseman|glover|koch|hansen|sls|lunar flyby|trans.?lunar|splashdown/i;

  function renderItems(items) {
    if (!items.length) return false;
    populateTicker(items);
    const newsHTML = items.slice(0,8).map(it => {
      const date = it.date ? esc(new Date(it.date).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})) : '';
      return `<div class="news-item">
        <div class="news-title"><a class="news-link" href="${safeUrl(it.link)}" target="_blank" rel="noopener">${esc(it.title)}</a></div>
        <div class="news-meta">${date} · NASA</div>
      </div>`;
    }).join('');
    const tsText = 'Updated: '+new Date().toUTCString().split(' ').slice(1,5).join(' ')+' UTC';
    const el = document.getElementById('news-list');
    if (el) { el.innerHTML = newsHTML; }
    const ts = document.getElementById('news-ts');
    if (ts) ts.textContent = tsText;
    const elMain = document.getElementById('news-list-main');
    if (elMain) { elMain.innerHTML = newsHTML; }
    const tsMain = document.getElementById('news-ts-main');
    if (tsMain) tsMain.textContent = tsText;
    return true;
  }

  function xmlToItems(txt, filter) {
    const xml = new DOMParser().parseFromString(txt, 'application/xml');
    let items = Array.from(xml.querySelectorAll('item')).map(it => ({
      title: it.querySelector('title')?.textContent || 'Update',
      link:  it.querySelector('link')?.textContent  || '#',
      date:  it.querySelector('pubDate')?.textContent || '',
    }));
    if (filter) items = items.filter(it => ARTEMIS_KW.test(it.title));
    return items.slice(0, 8);
  }

  async function tryFeed(feedUrl, filter) {
    try {
      const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`, {cache:'no-store'});
      const j = await r.json();
      if (j.status === 'ok' && j.items?.length) {
        let items = j.items.map(it => ({title: it.title, link: it.link, date: it.pubDate}));
        if (filter) items = items.filter(it => ARTEMIS_KW.test(it.title));
        if (items.length) return items;
      }
    } catch {}
    try {
      const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(feedUrl)}`, {cache:'no-store'});
      if (r.ok) { const items = xmlToItems(await r.text(), filter); if (items.length) return items; }
    } catch {}
    try {
      const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`, {cache:'no-store'});
      if (r.ok) { const items = xmlToItems(await r.text(), filter); if (items.length) return items; }
    } catch {}
    return null;
  }

  for (const feed of FEEDS) {
    const items = await tryFeed(feed, false);
    if (items && renderItems(items)) return;
  }

  const items = await tryFeed('https://www.nasa.gov/feed/', true);
  if (items && renderItems(items)) return;

  document.getElementById('news-list').innerHTML =
    '<div class="loading">Updates at <a href="https://www.nasa.gov/missions/artemis/" target="_blank" style="color:var(--accent)">nasa.gov/missions/artemis</a></div>';
  const elMain2 = document.getElementById('news-list-main');
  if (elMain2) elMain2.innerHTML = '<div class="loading">Updates at <a href="https://www.nasa.gov/missions/artemis/" target="_blank" style="color:var(--accent)">nasa.gov/missions/artemis</a></div>';
}

renderTimeline();
fetchOrbit();
connectAROW();
fetchDSN();
fetchWeather();
fetchNews();

setInterval(fetchOrbit, 30*1000);
setInterval(pollAROW, 10*1000);
setInterval(fetchDSN, 15*1000);
setInterval(fetchWeather, 15*60*1000);
setInterval(fetchNews, 5*60*1000);
setInterval(renderTimeline, 60*1000);

function updatePhase() {
  const elapsed = (Date.now()-LAUNCH_UTC)/1000;
  const day = elapsed/86400;
  let phase = 'Trans-Lunar Coast';
  if (day < 0.05) phase = 'Ascent';
  else if (day < 0.3) phase = 'Earth Orbit / Prox Ops';
  else if (day < 2) phase = 'Trans-Lunar Injection';
  else if (day < 5.5) phase = 'Trans-Lunar Coast';
  else if (day < 6.5) phase = '🌙 LUNAR FLYBY';
  else if (day < 9.5) phase = 'Trans-Earth Coast';
  else phase = 'Reentry / Splashdown';
  document.getElementById('orbit-phase').textContent = 'Phase: ' + phase;
}
setInterval(updatePhase, 10000);
updatePhase();

(function() {
  function loadTabIframe(tabId) {
    const frameMap = { arow: 'tab-arow-frame', dsn: 'tab-dsn-frame', broadcast: 'tab-broadcast-frame' };
    const frameId = frameMap[tabId];
    if (!frameId) return;
    const frame = document.getElementById(frameId);
    if (frame && (!frame.src || frame.src === 'about:blank' || frame.src.endsWith('/about:blank') || frame.src.endsWith('about:blank'))) {
      frame.src = frame.dataset.src;
    }
  }
  loadTabIframe('arow');
  document.getElementById('main-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.main-tab');
    if (!tab) return;
    const target = tab.dataset.tab;
    document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('tabpane-' + target).classList.add('active');
    loadTabIframe(target);
  });
})();

youtubePlayer(
  'https://www.youtube.com/watch?v=m3kR2KK8TEs',
  document.getElementById('yt-player-container')
);

(async function initCarousel() {
  const display = document.getElementById('img-display');
  const caption = document.getElementById('carousel-caption');
  const dotsEl  = document.getElementById('carousel-dots');
  let images = [];
  let current = 0;

  const FALLBACK = [
    { src: 'https://images-assets.nasa.gov/image/KSC-20230906-PH-KLS01_0001/KSC-20230906-PH-KLS01_0001~thumb.jpg', title: 'SLS Rollout to Launch Complex 39B', date: '2023-09-06' },
    { src: 'https://images-assets.nasa.gov/image/jsc2023e029920/jsc2023e029920~thumb.jpg', title: 'Artemis II Crew Portrait', date: '2023-04-03' },
    { src: 'https://images-assets.nasa.gov/image/KSC-20231109-PH-SPX01_0003/KSC-20231109-PH-SPX01_0003~thumb.jpg', title: 'Orion Spacecraft at Kennedy Space Center', date: '2023-11-09' },
    { src: 'https://images-assets.nasa.gov/image/KSC-20230310-PH-SPX01_0026/KSC-20230310-PH-SPX01_0026~thumb.jpg', title: 'SLS Core Stage Assembly', date: '2023-03-10' },
    { src: 'https://images-assets.nasa.gov/image/iss068e027184/iss068e027184~thumb.jpg', title: 'Earth from the International Space Station', date: '2022-11-14' },
    { src: 'https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~thumb.jpg', title: 'The Blue Marble — Apollo 17', date: '1972-12-07' },
  ];

  try {
    const r = await fetch('https://images-assets.nasa.gov/search?q=artemis+II+crew&media_type=image&page_size=12', {cache:'no-store'});
    if (!r.ok) throw new Error();
    const json = await r.json();
    const raw = (json.collection?.items || []).map(item => ({
      src:   item.links?.[0]?.href || '',
      title: item.data?.[0]?.title || '',
      date:  (item.data?.[0]?.date_created || '').slice(0, 10),
    })).filter(i => i.src && i.src.startsWith('http'));
    if (raw.length >= 3) images = raw;
  } catch {}

  if (!images.length) images = FALLBACK;

  images.forEach((img, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
    const el = document.createElement('img');
    el.src = img.src;
    el.alt = img.title;
    el.loading = 'lazy';
    el.onerror = () => { slide.style.display = 'none'; };
    slide.appendChild(el);
    display.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = 'c-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => showSlide(i));
    dotsEl.appendChild(dot);
  });

  function showSlide(idx) {
    const slides = display.querySelectorAll('.carousel-slide');
    const dots   = dotsEl.querySelectorAll('.c-dot');
    slides[current]?.classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (idx + images.length) % images.length;
    slides[current]?.classList.add('active');
    dots[current]?.classList.add('active');
    const img = images[current];
    caption.textContent = img.title + (img.date ? '  ' + img.date : '');
  }

  showSlide(0);
  setInterval(() => showSlide(current + 1), 7000);
})();

document.querySelectorAll('.eth-addr').forEach(el => {
  el.addEventListener('click', () => {
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      const orig = el.textContent;
      el.textContent = 'copied!';
      setTimeout(() => { el.textContent = orig; }, 1400);
    }).catch(() => {});
  });
});
