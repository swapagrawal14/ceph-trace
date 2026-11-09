// Ceph Trace — app + p5.js canvas
// Modes: trace (your ceph or demo), explore (learn landmarks), quiz (tap-to-find)

const GROUP_COL = { 'Cranial base': '#E5482F', 'Maxilla': '#F3B33D', 'Mandible': '#C8B3EA', 'Teeth': '#86D3A7' };
const LINE_COL = { SN: '#FFF8EC', FH: '#F3B33D', NA: '#F2A0C0', MP: '#E5482F', FAC: '#9DBDF5', Y: '#C8B3EA', OCC: '#86D3A7', INC: '#F6B9B4' };
const LM = Object.fromEntries(LANDMARKS.map(l => [l.id, l]));
const INK = '#17171C', PAPER = '#FFF8EC';

let demoImg = null;
let mode = 'trace';
let T = { img: null, P: {}, cur: 0, mmPerPx: null, calibPts: null, undo: [], isDemo: false };
let view = { s: 1, x: 0, y: 0 }, viewTarget = null;
let showLines = true, filt = { b: 100, c: 115, inv: false };
let norms = loadNorms(), sex = 'F', results = [];
let calibMode = false;
let exploreSel = 'S';
let Q = null;  // quiz state
const demoMmPerPx = DEMO.calib.mm / Math.hypot(DEMO.calib.b.x - DEMO.calib.a.x, DEMO.calib.b.y - DEMO.calib.a.y);

// pointer state
const ptrs = new Map();
let drag = null, place = null, pinch = null, pan = null, loupe = null;

// ================= p5 =================
function setup() {
  const c = createCanvas(10, 10);
  c.parent('stage');
  pixelDensity(Math.min(2, displayDensity()));
  bindPointer(c.elt);
  bindUI();
  loadImage(DEMO.src, im => { demoImg = im; drawRef(); });
  buildHeroTrace();
  document.getElementById('demoCredit').textContent = DEMO.credit;
  noLoop();
}

function resizeToStage() {
  const st = document.getElementById('stage');
  resizeCanvas(st.clientWidth, st.clientHeight);
}
function windowResized() { if (!document.getElementById('work').hidden) { resizeToStage(); if (curImg()) fit(true); } }

const curImg = () => (mode === 'trace' ? T.img : demoImg);
const curP = () => (mode === 'trace' ? T.P : mode === 'explore' ? DEMO.P : {});

function draw() {
  background('#141B3D');
  const img = curImg(); if (!img) return;
  if (viewTarget) {
    const e = 0.18;
    view.s += (viewTarget.s - view.s) * e; view.x += (viewTarget.x - view.x) * e; view.y += (viewTarget.y - view.y) * e;
    if (Math.abs(viewTarget.s - view.s) < 0.001 && Math.abs(viewTarget.x - view.x) < 0.3) { view = { ...viewTarget }; viewTarget = null; }
  }
  push(); translate(view.x, view.y); scale(view.s);
  drawScene(view.s, true);
  pop();
  if (loupe) drawLoupe();
  if (calibMode) banner('Ruler: tap two marks a known distance apart (' + (T.calibPts ? T.calibPts.length : 0) + '/2)');
}

function banner(t) {
  textFont('DM Sans'); textSize(13); textStyle(BOLD);
  const w = textWidth(t) + 26;
  stroke(INK); strokeWeight(2.5); fill('#F3B33D'); rect(12, 12, w, 32, 16);
  noStroke(); fill(INK); textAlign(LEFT, CENTER); text(t, 25, 28);
}

function drawScene(k, labels) {
  const ctx = drawingContext, img = curImg();
  ctx.save();
  ctx.filter = `brightness(${filt.b}%) contrast(${filt.c}%)` + (filt.inv ? ' invert(1)' : '');
  image(img, 0, 0);
  ctx.restore();
  if (mode === 'trace') {
    if (showLines) drawTracing(T.P, k);
    if (T.calibPts) {
      stroke('#F3B33D'); strokeWeight(2.5 / k); noFill();
      T.calibPts.forEach(p => circle(p.x, p.y, 14 / k));
      if (T.calibPts.length === 2) line(T.calibPts[0].x, T.calibPts[0].y, T.calibPts[1].x, T.calibPts[1].y);
    }
    drawMarkers(T.P, k, labels, LANDMARKS[T.cur] && LANDMARKS[T.cur].id);
  } else if (mode === 'explore') {
    if (showLines) drawTracing(DEMO.P, k, 0.45);
    drawMarkers(DEMO.P, k, labels, exploreSel, true);
  } else if (mode === 'quiz' && Q && Q.reveal) {
    const id = Q.order[Q.i], c = DEMO.P[id], g = Q.reveal;
    stroke(PAPER); strokeWeight(2 / k); ctx.setLineDash([6 / k, 5 / k]); line(g.x, g.y, c.x, c.y); ctx.setLineDash([]);
    marker(g.x, g.y, k, '#9DBDF5', '?', false);
    marker(c.x, c.y, k, GROUP_COL[LM[id].group], id, true);
    const r = 2 / demoMmPerPx;  // 2 mm bullseye ring
    noFill(); stroke(GROUP_COL[LM[id].group]); strokeWeight(2 / k); ctx.setLineDash([4 / k, 4 / k]); circle(c.x, c.y, r * 2); ctx.setLineDash([]);
  }
}

function seg(a, b, col, k, ext = 0, dash = false, alpha = 1) {
  if (!a || !b) return;
  const d = { x: b.x - a.x, y: b.y - a.y }, L = Math.hypot(d.x, d.y) || 1, e = ext / k;
  const c = color(col); c.setAlpha(255 * alpha);
  stroke(c); strokeWeight(2.4 / k);
  drawingContext.setLineDash(dash ? [7 / k, 6 / k] : []);
  line(a.x - d.x / L * e, a.y - d.y / L * e, b.x + d.x / L * e, b.y + d.y / L * e);
  drawingContext.setLineDash([]);
}

function drawTracing(p, k, al = 1) {
  seg(p.S, p.N, LINE_COL.SN, k, 40, false, al);
  seg(p.Po, p.Or, LINE_COL.FH, k, 60, false, al);
  seg(p.N, p.A, LINE_COL.NA, k, 30, false, al);
  seg(p.N, p.B, LINE_COL.NA, k, 30, true, al);
  seg(p.Go, p.Me, LINE_COL.MP, k, 50, false, al);
  seg(p.Go, p.Gn, LINE_COL.MP, k, 0, true, al);
  seg(p.N, p.Pog, LINE_COL.FAC, k, 20, true, al);
  seg(p.S, p.Gn, LINE_COL.Y, k, 0, true, al);
  if (p.Mo && p.U1T && p.L1T) seg(p.Mo, mid(p.U1T, p.L1T), LINE_COL.OCC, k, 50, false, al);
  if (p.Mo && p.Pm) seg(p.Mo, p.Pm, LINE_COL.OCC, k, 70, true, al);
  seg(p.U1A, p.U1T, LINE_COL.INC, k, 25, false, al);
  seg(p.L1A, p.L1T, LINE_COL.INC, k, 25, false, al);
  if (p.Mo && p.Pm && p.A && p.B) {
    const d = unit(V(p.Mo, p.Pm));
    for (const q of [p.A, p.B]) { const t = dot(V(p.Mo, q), d); seg(q, { x: p.Mo.x + d.x * t, y: p.Mo.y + d.y * t }, '#86D3A7', k, 0, true, 0.7 * al); }
  }
}

function marker(x, y, k, col, label, big) {
  const r = (big ? 9 : 6.5) / k;
  stroke(INK); strokeWeight(2.2 / k); fill(col); circle(x, y, r * 2);
  noStroke(); fill(INK); circle(x, y, 2.4 / k);
  if (label) {
    textFont('DM Sans'); textStyle(BOLD); textSize((big ? 13 : 11.5) / k);
    const w = textWidth(label) + 10 / k, h = (big ? 19 : 17) / k, lx = x + r + 4 / k, ly = y - h / 2;
    stroke(INK); strokeWeight(1.6 / k); fill(big ? col : PAPER); rect(lx, ly, w, h, h / 2);
    noStroke(); fill(INK); textAlign(LEFT, CENTER); text(label, lx + 5 / k, y + 0.5 / k);
  }
}

function drawMarkers(P, k, labels, hi, explore) {
  const used = [];
  const free = (p, force) => { const q = { x: p.x * k, y: p.y * k };
    if (!force && used.some(u => Math.abs(u.x - q.x) < 34 && Math.abs(u.y - q.y) < 16)) return false; used.push(q); return true; };
  if (hi && P[hi]) free(P[hi], true);
  for (const L of LANDMARKS) {
    const p = P[L.id]; if (!p) continue;
    const isHi = L.id === hi || (drag && drag.id === L.id);
    if (isHi && explore) {
      const t = (millis() % 1400) / 1400;
      noFill(); stroke(GROUP_COL[L.group]); strokeWeight(3 / k);
      drawingContext.globalAlpha = 1 - t; circle(p.x, p.y, (18 + t * 46) / k); drawingContext.globalAlpha = 1;
    }
    const showLab = labels && (isHi || free(p, false));
    marker(p.x, p.y, k, GROUP_COL[L.group], showLab ? L.id : null, isHi);
  }
}

function drawLoupe() {
  const r = Math.min(78, width * 0.2), z = 3;
  const cx = loupe.sx < width / 2 ? width - r - 16 : r + 16, cy = r + 16;
  const ctx = drawingContext;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  background('#141B3D');
  translate(cx, cy); scale(view.s * z); translate(-loupe.ix, -loupe.iy);
  drawScene(view.s * z, false);
  ctx.restore(); resetMatrix();
  noFill(); stroke(INK); strokeWeight(5); circle(cx, cy, r * 2);
  stroke(PAPER); strokeWeight(2.5); circle(cx, cy, r * 2);
  stroke('#E5482F'); strokeWeight(2);
  line(cx - 14, cy, cx - 5, cy); line(cx + 5, cy, cx + 14, cy); line(cx, cy - 14, cx, cy - 5); line(cx, cy + 5, cx, cy + 14);
  const lab = drag ? drag.id : calibMode ? 'ruler' : mode === 'quiz' ? 'your guess' : (LANDMARKS[T.cur] ? LANDMARKS[T.cur].id : '');
  if (lab) { textFont('DM Sans'); textStyle(BOLD); textSize(12); const w = textWidth(lab) + 16;
    stroke(INK); strokeWeight(2); fill('#F3B33D'); rect(cx - w / 2, cy + r - 12, w, 22, 11);
    noStroke(); fill(INK); textAlign(CENTER, CENTER); text(lab, cx, cy + r - 1); }
}

// ================= view =================
const toImg = (sx, sy) => ({ x: (sx - view.x) / view.s, y: (sy - view.y) / view.s });
const toScr = p => ({ x: p.x * view.s + view.x, y: p.y * view.s + view.y });
function fitView() {
  const img = curImg();
  // demo ceph: frame the face (landmark region) instead of the whole film
  let r = { x: 0, y: 0, w: img.width, h: img.height };
  if (img === demoImg) {
    const pts = Object.values(DEMO.P), xs = pts.map(p => p.x), ys = pts.map(p => p.y), m = 70;
    r = { x: Math.min(...xs) - m, y: Math.min(...ys) - m, w: Math.max(...xs) - Math.min(...xs) + 2 * m, h: Math.max(...ys) - Math.min(...ys) + 2 * m };
  }
  const s = Math.min(width / r.w, height / r.h) * 0.96;
  return { s, x: (width - r.w * s) / 2 - r.x * s, y: (height - r.h * s) / 2 - r.y * s };
}
function fit(instant) { const v = fitView(); if (instant) { view = v; viewTarget = null; } else viewTarget = v; }
function focusOn(p, zoom) {
  const s = fitView().s * zoom;
  viewTarget = { s, x: width / 2 - p.x * s, y: height / 2 - p.y * s };
}
function zoomAt(f, sx, sy) {
  viewTarget = null;
  const ns = constrain(view.s * f, 0.05, 40), ip = toImg(sx, sy);
  view = { s: ns, x: sx - ip.x * ns, y: sy - ip.y * ns };
}

// ================= pointer =================
function localXY(e, el) { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function hitTest(P, sx, sy, rad = 26) {
  let best = null, bd = rad;
  for (const L of LANDMARKS) { const p = P[L.id]; if (!p) continue;
    const q = toScr(p), d = Math.hypot(q.x - sx, q.y - sy); if (d < bd) { bd = d; best = L.id; } }
  return best;
}

function bindPointer(el) {
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', e => { e.preventDefault(); if (!curImg()) return; const p = localXY(e, el); zoomAt(Math.exp(-e.deltaY * 0.0015), p.x, p.y); }, { passive: false });

  el.addEventListener('pointerdown', e => {
    if (!curImg()) return;
    el.setPointerCapture(e.pointerId);
    const p = localXY(e, el); ptrs.set(e.pointerId, p); viewTarget = null;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      drag = place = pan = loupe = null;
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), m0: mid(a, b), v0: { ...view } };
      return;
    }
    if (e.button === 1 || e.button === 2 || e.shiftKey) { pan = { p0: p, v0: { ...view } }; return; }
    const ip = toImg(p.x, p.y);
    if (mode === 'explore') { pan = { p0: p, v0: { ...view }, tap: true }; return; }
    if (mode === 'quiz') {
      if (Q && !Q.reveal && !Q.done) { place = { p0: p }; loupe = { sx: p.x, sy: p.y, ix: ip.x, iy: ip.y }; }
      else pan = { p0: p, v0: { ...view } };
      return;
    }
    // trace
    const hit = !calibMode && hitTest(T.P, p.x, p.y);
    if (hit) {
      pushUndo();
      drag = { id: hit, p0: p, q0: { ...T.P[hit] } };
      loupe = { sx: p.x, sy: p.y, ix: T.P[hit].x, iy: T.P[hit].y };
      T.cur = LANDMARKS.findIndex(L => L.id === hit); updateStep();
    } else if (calibMode || LANDMARKS[T.cur]) {
      place = { p0: p }; loupe = { sx: p.x, sy: p.y, ix: ip.x, iy: ip.y };
    } else pan = { p0: p, v0: { ...view } };
  });

  el.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    const p = localXY(e, el); ptrs.set(e.pointerId, p);
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), m = mid(a, b);
      const ns = constrain(pinch.v0.s * d / pinch.d0, 0.05, 40);
      const ix = (pinch.m0.x - pinch.v0.x) / pinch.v0.s, iy = (pinch.m0.y - pinch.v0.y) / pinch.v0.s;
      view = { s: ns, x: m.x - ix * ns, y: m.y - iy * ns }; return;
    }
    if (pan) { view.x = pan.v0.x + p.x - pan.p0.x; view.y = pan.v0.y + p.y - pan.p0.y; if (Math.hypot(p.x - pan.p0.x, p.y - pan.p0.y) > 8) pan.tap = false; return; }
    if (drag) {
      T.P[drag.id] = { x: drag.q0.x + (p.x - drag.p0.x) / view.s, y: drag.q0.y + (p.y - drag.p0.y) / view.s };
      loupe = { sx: p.x, sy: p.y, ix: T.P[drag.id].x, iy: T.P[drag.id].y };
      compute(); return;
    }
    if (place) { const ip = toImg(p.x, p.y); loupe = { sx: p.x, sy: p.y, ix: ip.x, iy: ip.y }; }
  });

  const end = e => {
    if (!ptrs.has(e.pointerId)) return;
    const p = localXY(e, el); ptrs.delete(e.pointerId);
    if (pinch) { if (ptrs.size < 2) pinch = null; return; }
    if (pan && pan.tap && mode === 'explore') { const id = hitTest(DEMO.P, p.x, p.y, 34); if (id) selectExplore(id, false); }
    if (place) {
      const ip = toImg(p.x, p.y);
      if (mode === 'quiz') quizGuess(ip);
      else if (calibMode) addCalib(ip);
      else if (LANDMARKS[T.cur]) { pushUndo(); T.P[LANDMARKS[T.cur].id] = ip; advance(); }
    }
    if (drag) { compute(); updateStep(); }
    drag = place = pan = loupe = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  window.addEventListener('keydown', e => {
    if (mode !== 'trace' || !T.img || e.target.tagName === 'INPUT') return;
    const id = LANDMARKS[T.cur] && LANDMARKS[T.cur].id;
    const step = (e.shiftKey ? 5 : 0.5) / Math.max(view.s, 0.2);
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv && id && T.P[id]) { e.preventDefault(); T.P[id] = { x: T.P[id].x + mv[0] * step, y: T.P[id].y + mv[1] * step }; compute(); }
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
  });
}

// ================= trace logic =================
function advance() {
  const next = LANDMARKS.findIndex((L, i) => i > T.cur && !T.P[L.id]);
  const any = LANDMARKS.findIndex(L => !T.P[L.id]);
  T.cur = next >= 0 ? next : (any >= 0 ? any : LANDMARKS.length);
  compute(); updateStep();
  if (T.cur >= LANDMARKS.length) { toast('All 18 placed! Check the Analysis tab.'); }
}
function addCalib(ip) {
  T.calibPts.push(ip);
  if (T.calibPts.length === 2) {
    const px = Math.hypot(T.calibPts[1].x - T.calibPts[0].x, T.calibPts[1].y - T.calibPts[0].y);
    setTimeout(() => {
      const mm = parseFloat(prompt('How many mm apart are those two ruler marks?', '10'));
      if (mm > 0 && px > 0) { T.mmPerPx = mm / px; toast('Calibrated ✓ ' + (1 / T.mmPerPx).toFixed(1) + ' px per mm'); } else T.calibPts = null;
      calibMode = false; compute(); updateStep();
    }, 30);
  }
}
function pushUndo() { T.undo.push(JSON.stringify({ P: T.P, cur: T.cur })); if (T.undo.length > 80) T.undo.shift(); }
function undo() { const s = T.undo.pop(); if (!s) return toast('Nothing to undo'); const o = JSON.parse(s); T.P = o.P; T.cur = o.cur; compute(); updateStep(); }

function compute() { results = runAnalysis(T.P, norms, T.mmPerPx, sex); renderResults(); }

// ================= UI =================
const $ = id => document.getElementById(id);
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

function openWork(m) {
  $('home').hidden = true; $('work').hidden = false;
  window.scrollTo(0, 0);
  setMode(m);
  requestAnimationFrame(() => { resizeToStage(); if (curImg()) fit(true); loop(); });
}
function goHome() { $('work').hidden = true; $('home').hidden = false; noLoop(); buildHeroTrace(); }

function setMode(m) {
  mode = m; calibMode = false; loupe = null;
  $('modePill').textContent = { trace: T.isDemo ? 'Demo' : 'Trace', explore: 'Learn', quiz: 'Quiz' }[m];
  $('upBtn').hidden = m !== 'trace';
  const tabs = m === 'trace' ? [['trace', 'Landmarks'], ['analysis', 'Analysis']] : [['explore', 'Explore'], ['quiz', 'Quiz']];
  $('tabs').innerHTML = tabs.map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join('');
  $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
  showTab(m === 'quiz' ? 'quiz' : tabs[0][0]);
  $('hud').querySelector('[data-act=undo]').hidden = m !== 'trace';
}
function showTab(t) {
  ['trace', 'analysis', 'explore', 'quiz'].forEach(k => $('tab-' + k).hidden = k !== t);
  $('tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  if (t === 'explore') { if (mode !== 'explore') { mode = 'explore'; $('modePill').textContent = 'Learn'; fit(); } renderExplore(); }
  if (t === 'quiz') { if (mode !== 'quiz') { mode = 'quiz'; $('modePill').textContent = 'Quiz'; } if (!Q) quizIntro(); fit(); }
  if (t === 'analysis') renderResults();
  $('panel').scrollTop = 0;
}

function startTrace(im, demo) {
  T = { img: im, P: demo ? JSON.parse(JSON.stringify(DEMO.P)) : {}, cur: demo ? LANDMARKS.length : 0,
        mmPerPx: demo ? demoMmPerPx : null, calibPts: demo ? [DEMO.calib.a, DEMO.calib.b] : null, undo: [], isDemo: demo };
  openWork('trace'); compute(); updateStep();
  if (demo) { showTab('analysis'); toast('Demo ceph, fully traced. Drag any point and watch the numbers move.'); }
  else toast('Start with Sella. Tap to place, pinch to zoom.');
}

function updateStep() {
  const L = LANDMARKS[T.cur], n = LANDMARKS.filter(l => T.P[l.id]).length;
  $('progFill').style.width = (n / LANDMARKS.length * 100) + '%';
  $('progTxt').textContent = `${n} / ${LANDMARKS.length} landmarks`;
  if (L) {
    $('stepDot').textContent = L.id; $('stepDot').style.background = GROUP_COL[L.group];
    $('stepDot').style.color = L.group === 'Cranial base' ? PAPER : INK;
    $('stepGrp').textContent = L.group; $('stepName').textContent = L.name;
    $('stepDef').textContent = L.def; $('stepFind').textContent = L.find;
  } else {
    $('stepDot').textContent = '✓'; $('stepDot').style.background = '#86D3A7'; $('stepDot').style.color = INK;
    $('stepGrp').textContent = 'Done'; $('stepName').textContent = 'Tracing complete';
    $('stepDef').textContent = 'Drag any point to refine it, or tap a chip below to re-place a landmark.';
    $('stepFind').textContent = 'Open the Analysis tab for your values, quick read and export.';
  }
  $('stepInfo').hidden = !L;
  $('chips').innerHTML = LANDMARKS.map((l, i) => `<button class="chip ${T.P[l.id] ? 'done' : ''} ${i === T.cur ? 'cur' : ''}" data-i="${i}">${l.id}</button>`).join('');
  $('chips').querySelectorAll('.chip').forEach(c => c.onclick = () => { T.cur = +c.dataset.i; updateStep(); const p = T.P[LANDMARKS[T.cur].id]; if (p) focusOn(p, 2.2); });
  const cc = $('calibCard');
  cc.classList.toggle('ok', !!T.mmPerPx);
  $('calibTxt').textContent = T.mmPerPx ? `Calibrated: ${(1 / T.mmPerPx).toFixed(1)} px per mm` : 'Needed for mm values (U1–NA mm, L1–NB mm, U1–APog, Wits).';
  $('calibBtn').textContent = calibMode ? 'Cancel' : T.mmPerPx ? 'Redo' : 'Calibrate';
  drawRef();
}

// mini reference crop from the demo ceph
function drawRef(id) {
  const cv = $('refCv'); if (!cv) return;
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  ctx.fillStyle = '#141B3D'; ctx.fillRect(0, 0, W, H);
  id = id || (LANDMARKS[T.cur] && LANDMARKS[T.cur].id);
  if (!demoImg || !id) { cv.parentElement.style.display = id ? '' : 'none'; return; }
  cv.parentElement.style.display = '';
  const p = DEMO.P[id], sw = 300, sh = sw * H / W;
  ctx.save(); ctx.filter = 'contrast(1.2)';
  ctx.drawImage(demoImg.canvas, p.x - sw / 2, p.y - sh / 2, sw, sh, 0, 0, W, H);
  ctx.restore();
  const cx = W / 2, cy = H / 2, col = GROUP_COL[LM[id].group];
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function fmt(v, u) { return v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1) + (u === '°' ? '°' : ' mm'); }

function renderResults() {
  const q = quickRead(results), done = results.filter(r => r.val != null).length;
  $('quick').innerHTML = q.length
    ? q.map((x, i) => `<div class="qcard q${i}"><small>${x.t}</small><b>${x.v}</b></div>`).join('') + '<div class="qnote">Indicative read from the values below, not a diagnosis.</div>'
    : `<div class="qcard q1" style="grid-column:1/-1"><small>Analysis</small><b>Place landmarks to see results (${done}/${results.length} ready)</b></div>`;
  let h = '', g = '';
  for (const r of results) {
    if (r.g !== g) { g = r.g; h += `<div class="ghead">${g}</div>`; }
    const [mean, lo, hi] = r.norm, span = (hi - lo) || 1, a = lo - span * 1.2, b = hi + span * 1.2;
    const pct = v => Math.max(0, Math.min(100, (v - a) / (b - a) * 100));
    const pin = r.val != null && r.status !== 'calib' ? `<span class="pin" style="left:${pct(r.val)}%"></span>` : '';
    h += `<div class="mcard s-${r.status}">
      <div class="mtop"><b>${r.label}</b><span class="mval">${r.status === 'calib' ? 'needs ruler' : fmt(r.val, r.u)}</span></div>
      <div class="bar2"><span class="zone" style="left:${pct(lo)}%;width:${pct(hi) - pct(lo)}%"></span>${pin}</div>
      <div class="mbot"><span>Norm ${mean}${r.u === '°' ? '°' : ' mm'} (${lo} to ${hi})</span><span class="mnote">${r.status === 'na' ? 'Needs ' + r.needs.filter(id => !T.P[id]).join(', ') : r.note}</span></div>
      <div class="mmean">${r.means}</div></div>`;
  }
  $('results').innerHTML = h;
}

// ================= explore =================
const GROUPS = ['All', 'Cranial base', 'Maxilla', 'Mandible', 'Teeth'];
let grpFilter = 'All';
function renderExplore() {
  $('grpSeg').innerHTML = GROUPS.map(gp => `<button class="${gp === grpFilter ? 'on' : ''}" data-g="${gp}">${gp === 'Cranial base' ? 'Cranium' : gp}</button>`).join('');
  $('grpSeg').querySelectorAll('button').forEach(b => b.onclick = () => { grpFilter = b.dataset.g; renderExplore(); });
  $('lmList').innerHTML = LANDMARKS.filter(l => grpFilter === 'All' || l.group === grpFilter)
    .map(l => `<button class="lmi ${l.id === exploreSel ? 'on' : ''}" data-id="${l.id}"><i style="background:${GROUP_COL[l.group]}">${l.id}</i>${l.name}</button>`).join('');
  $('lmList').querySelectorAll('.lmi').forEach(b => b.onclick = () => selectExplore(b.dataset.id, true));
  renderStory();
}
function selectExplore(id, scroll) {
  exploreSel = id; renderExplore();
  if (width > 20) focusOn(DEMO.P[id], 2.4);
  if (scroll) $('panel').scrollTo({ top: 0, behavior: 'smooth' });
}
function renderStory() {
  const L = LM[exploreSel], i = LANDMARKS.indexOf(L);
  $('story').innerHTML = `
    <div class="stepHead"><div class="dot" style="background:${GROUP_COL[L.group]};color:${L.group === 'Cranial base' ? PAPER : INK}">${L.id}</div>
    <div><div class="grp">${L.group} · ${i + 1} of ${LANDMARKS.length}</div><h2>${L.name}</h2></div></div>
    <p>${L.def}</p>
    <div class="lbl">How to find it</div><p>${L.find}</p>
    <div class="lbl">Why it matters</div><p>${L.why}</p>
    <div class="hook">💡 ${L.trick}</div>
    <button class="infoThumb" id="exInfo"><img src="assets/info/${L.id}.jpg" alt="${L.name} infographic" loading="lazy"><span>Open ✦</span></button>
    <div class="row" style="margin-top:12px">
      <button class="btn" id="exPrev">‹ Prev</button><button class="btn ink" id="exNext">Next ›</button>
    </div>`;
  $('exInfo').onclick = () => openInfo(L.id);
  $('exPrev').onclick = () => selectExplore(LANDMARKS[(i + LANDMARKS.length - 1) % LANDMARKS.length].id, false);
  $('exNext').onclick = () => selectExplore(LANDMARKS[(i + 1) % LANDMARKS.length].id, false);
}

// ================= quiz =================
const QN = 10;
function quizIntro() {
  Q = null;
  $('quizCard').innerHTML = `
    <div class="big">🎯</div><h2>Find the landmark</h2>
    <p>${QN} landmarks on a real ceph. Tap where you think it is. Within 2 mm is a bullseye.</p>
    <p style="font-size:13px">Tip: press and slide your finger, the loupe helps you aim. Pinch to zoom.</p>
    <div class="row"><button class="btn ink" id="qStart">Start quiz</button></div>`;
  $('qStart').onclick = quizStart;
}
function quizStart() {
  const ids = LANDMARKS.map(l => l.id).sort(() => Math.random() - 0.5).slice(0, QN);
  Q = { order: ids, i: 0, score: 0, reveal: null, hint: false, log: [] };
  fit(); renderQuiz();
}
function quizGuess(ip) {
  const id = Q.order[Q.i], c = DEMO.P[id];
  const mm = Math.hypot(ip.x - c.x, ip.y - c.y) * demoMmPerPx;
  const pts = mm <= 2 ? 100 : Math.max(0, Math.round(100 - (mm - 2) * 14));
  Q.reveal = ip; Q.mm = mm; Q.pts = pts; Q.score += pts; Q.log.push({ id, mm });
  renderQuiz();
}
function renderQuiz() {
  if (!Q) return quizIntro();
  if (Q.done) {
    const stars = Q.score >= 850 ? 3 : Q.score >= 600 ? 2 : Q.score >= 300 ? 1 : 0;
    const worst = [...Q.log].sort((a, b) => b.mm - a.mm).slice(0, 2).map(x => LM[x.id].name);
    $('quizCard').innerHTML = `<div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="big">${Q.score}</div><p>out of ${QN * 100}</p>
      <p>${stars === 3 ? 'Ortho PG material. Seriously.' : stars === 2 ? 'Solid! A couple more rounds and you own these.' : 'Good start. Revise in Explore and try again.'}</p>
      <div class="hintBox"><b>Revise next:</b> ${worst.join(', ')}</div>
      <div class="row"><button class="btn" id="qLearn">Explore</button><button class="btn ink" id="qAgain">Play again</button></div>`;
    $('qAgain').onclick = quizStart; $('qLearn').onclick = () => { selectExplore(Q.log.sort((a, b) => b.mm - a.mm)[0].id); showTab('explore'); };
    return;
  }
  const id = Q.order[Q.i], L = LM[id];
  let body;
  if (!Q.reveal) {
    body = `<p>Tap on the ceph where you'd mark it.</p>
      ${Q.hint ? `<div class="hintBox">${L.find}</div>` : `<div class="row"><button class="btn ghost sm" id="qHint">Show hint</button></div>`}`;
  } else {
    const v = Q.mm <= 2 ? 'Bullseye! 🎯' : Q.mm <= 4 ? 'So close!' : Q.mm <= 7 ? 'Getting there' : 'Not quite';
    body = `<div class="verdict">${v}</div><p>${Q.mm.toFixed(1)} mm away · +${Q.pts}</p>
      <div class="hintBox">${L.find}</div>
      <div class="row"><button class="btn ink" id="qNext">${Q.i + 1 < QN ? 'Next ›' : 'See score'}</button></div>`;
  }
  $('quizCard').innerHTML = `<div class="qmeta"><span>${Q.i + 1} / ${QN}</span><span>Score ${Q.score}</span></div>
    <p style="margin:0">Find</p><h2>${L.name} <span style="opacity:.6">(${L.id})</span></h2>${body}`;
  if ($('qHint')) $('qHint').onclick = () => { Q.hint = true; renderQuiz(); };
  if ($('qNext')) $('qNext').onclick = () => { Q.i++; Q.reveal = null; Q.hint = false; if (Q.i >= QN) Q.done = true; fit(); renderQuiz(); };
  if (Q.reveal) focusOn(mid(Q.reveal, DEMO.P[id]), 1.8);
}

// ================= wiring =================
function bindUI() {
  document.querySelectorAll('.fileIn').forEach(inp => inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => loadImage(rd.result, im => startTrace(im, false));
    rd.readAsDataURL(f); e.target.value = '';
  });
  const acts = {
    home: goHome,
    demo: () => demoImg ? startTrace(demoImg, true) : loadImage(DEMO.src, im => { demoImg = im; startTrace(im, true); }),
    learn: () => { const go = () => { openWork('explore'); setTimeout(() => selectExplore(exploreSel), 60); }; demoImg ? go() : loadImage(DEMO.src, im => { demoImg = im; go(); }); },
    fit: () => fit(),
    zin: () => zoomAt(1.4, width / 2, height / 2),
    zout: () => zoomAt(1 / 1.4, width / 2, height / 2),
    lines: () => { showLines = !showLines; document.querySelector('[data-act=lines]').classList.toggle('on', showLines); },
    undo, prev: () => { T.cur = Math.max(0, Math.min(T.cur, LANDMARKS.length) - 1); updateStep(); },
    next: () => { T.cur = Math.min(LANDMARKS.length, T.cur + 1); updateStep(); },
    skip: () => { T.cur = Math.min(LANDMARKS.length, T.cur + 1); updateStep(); },
    calib: () => { calibMode = !calibMode; if (calibMode) { T.calibPts = []; toast('Tap two marks on the ruler'); } updateStep(); },
    reset: () => { if (!confirm('Clear all landmarks and calibration?')) return; pushUndo(); T.P = {}; T.cur = 0; T.mmPerPx = null; T.calibPts = null; compute(); updateStep(); },
    png: exportPNG, csv: exportCSV, norms: toggleNorms,
  };
  document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => acts[b.dataset.act] && acts[b.dataset.act]()));
  $('bri').oninput = e => filt.b = +e.target.value;
  $('con').oninput = e => filt.c = +e.target.value;
  $('inv').onchange = e => filt.inv = e.target.checked;
  $('sexSeg').querySelectorAll('button').forEach(b => b.onclick = () => {
    sex = b.dataset.sex; $('sexSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); compute(); });
  compute();
}

// hero: animated tracing over the demo ceph
function buildHeroTrace() {
  const svg = $('heroTrace'); if (!svg) return;
  const p = DEMO.P, L = [['S','N','#FFF8EC'],['Po','Or','#F3B33D'],['N','A','#F2A0C0'],['N','B','#F2A0C0'],['Go','Me','#E5482F'],['N','Pog','#9DBDF5'],['S','Gn','#C8B3EA'],['U1A','U1T','#F6B9B4'],['L1A','L1T','#F6B9B4'],['Mo','Pm','#86D3A7']];
  let h = '';
  L.forEach(([a, b, c], i) => { const l = Math.hypot(p[b].x - p[a].x, p[b].y - p[a].y);
    h += `<line x1="${p[a].x}" y1="${p[a].y}" x2="${p[b].x}" y2="${p[b].y}" stroke="${c}" style="--l:${l};animation-delay:${0.3 + i * 0.18}s"/>`; });
  LANDMARKS.forEach((l, i) => { const q = p[l.id];
    h += `<circle cx="${q.x}" cy="${q.y}" r="11" fill="${GROUP_COL[l.group]}" style="animation-delay:${2 + i * 0.05}s"/>`; });
  svg.innerHTML = h;
}

// ================= export =================
function exportCSV() {
  const rows = [['Group', 'Measurement', 'Value', 'Unit', 'Norm', 'Range low', 'Range high', 'Interpretation']];
  for (const r of results) rows.push([r.g, r.label, r.val == null ? '' : r.val.toFixed(1), r.u, r.norm[0], r.norm[1], r.norm[2], r.note]);
  rows.push([]); rows.push(['Landmark', 'x (px)', 'y (px)']);
  for (const L of LANDMARKS) if (T.P[L.id]) rows.push([L.id, T.P[L.id].x.toFixed(1), T.P[L.id].y.toFixed(1)]);
  if (T.mmPerPx) rows.push(['mm per px', T.mmPerPx.toFixed(5)]);
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  download(new Blob([csv], { type: 'text/csv' }), 'ceph-trace-analysis.csv');
}

function exportPNG() {
  if (!T.img) return toast('Upload a ceph first');
  const img = T.img, sc = Math.min(1, 1500 / Math.max(img.width, img.height));
  const W = Math.round(img.width * sc), H = Math.round(img.height * sc), pad = 40, tw = 720;
  const rowsH = 230 + results.length * 34 + 140;
  const CW = W + tw + pad * 3, CH = Math.max(H + pad * 2 + 90, rowsH);
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const c = cv.getContext('2d');
  c.fillStyle = '#FFF8EC'; c.fillRect(0, 0, CW, CH);
  c.fillStyle = '#6F9BEA'; c.fillRect(0, 0, CW, 90);
  c.fillStyle = '#E5482F'; c.beginPath(); c.arc(CW - 90, 45, 30, 0, Math.PI * 2); c.fill();
  c.font = '900 46px Fraunces, Georgia, serif'; c.lineWidth = 6; c.strokeStyle = INK; c.strokeText('Ceph Trace', pad, 62); c.fillStyle = PAPER; c.fillText('Ceph Trace', pad, 62);
  c.font = '600 18px "DM Sans", sans-serif'; c.fillStyle = INK; c.fillText('Cephalometric analysis report · ' + new Date().toLocaleDateString(), pad + 300, 58);
  // image + tracing
  const ox = pad, oy = 90 + pad;
  c.save(); c.filter = `brightness(${filt.b}%) contrast(${filt.c}%)` + (filt.inv ? ' invert(1)' : '');
  c.drawImage(img.canvas, ox, oy, W, H); c.restore();
  c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(ox, oy, W, H);
  const P = T.P, tp = q => [ox + q.x * sc, oy + q.y * sc];
  const ln = (a, b, col, dash) => { if (!a || !b) return; c.strokeStyle = col; c.lineWidth = 3; c.setLineDash(dash ? [10, 8] : []); c.beginPath(); c.moveTo(...tp(a)); c.lineTo(...tp(b)); c.stroke(); c.setLineDash([]); };
  ln(P.S, P.N, LINE_COL.SN); ln(P.Po, P.Or, LINE_COL.FH); ln(P.N, P.A, LINE_COL.NA); ln(P.N, P.B, LINE_COL.NA, true);
  ln(P.Go, P.Me, LINE_COL.MP); ln(P.N, P.Pog, LINE_COL.FAC, true); ln(P.S, P.Gn, LINE_COL.Y, true);
  ln(P.U1A, P.U1T, LINE_COL.INC); ln(P.L1A, P.L1T, LINE_COL.INC);
  if (P.Mo && P.U1T && P.L1T) ln(P.Mo, mid(P.U1T, P.L1T), LINE_COL.OCC); ln(P.Mo, P.Pm, LINE_COL.OCC, true);
  c.font = '700 15px "DM Sans", sans-serif';
  for (const L of LANDMARKS) { const q = P[L.id]; if (!q) continue; const [x, y] = tp(q);
    c.fillStyle = GROUP_COL[L.group]; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 4; c.strokeStyle = INK; c.strokeText(L.id, x + 10, y + 5); c.fillStyle = PAPER; c.fillText(L.id, x + 10, y + 5); }
  // table
  let x = W + pad * 2, y = 90 + pad + 10;
  const q = quickRead(results);
  c.font = '800 26px Fraunces, Georgia, serif'; c.fillStyle = INK; c.fillText('Quick read', x, y + 20); y += 40;
  c.font = '600 17px "DM Sans", sans-serif';
  q.forEach(o => { c.fillStyle = '#3B3B46'; c.fillText(o.t + ':', x, y + 16); c.fillStyle = INK; c.fillText(o.v, x + 140, y + 16); y += 26; });
  y += 14; let grp = '';
  for (const r of results) {
    if (r.g !== grp) { grp = r.g; y += 12; c.font = '800 22px Fraunces, Georgia, serif'; c.fillStyle = '#2340B8'; c.fillText(grp, x, y + 18); y += 32; }
    const col = { ok: '#1E8A55', low: '#2340B8', high: '#E5482F', calib: '#B07A0A' }[r.status] || '#9A9AA6';
    c.font = '600 17px "DM Sans", sans-serif'; c.fillStyle = INK; c.fillText(r.label, x, y + 16);
    c.font = '800 18px "DM Sans", sans-serif'; c.fillStyle = col; c.fillText(r.status === 'calib' ? '—' : fmt(r.val, r.u), x + 250, y + 16);
    c.font = '500 14px "DM Sans", sans-serif'; c.fillStyle = '#3B3B46'; c.fillText(`${r.norm[0]} (${r.norm[1]} to ${r.norm[2]})`, x + 360, y + 16);
    c.fillStyle = col; c.fillText(r.status === 'na' ? '' : r.note, x + 500, y + 16);
    y += 30;
  }
  c.font = '500 14px "DM Sans", sans-serif'; c.fillStyle = '#3B3B46';
  c.fillText('Educational aid. Verify landmarks and values clinically.', x, CH - 46);
  c.fillText('Ceph Trace · Swapnil Agrawal (BDS intern)' + (T.isDemo ? ' · ' + DEMO.credit : ''), x, CH - 24);
  cv.toBlob(b => download(b, 'ceph-trace-report.png'), 'image/png');
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ================= norms =================
function loadNorms() {
  try { const s = JSON.parse(localStorage.getItem('cephNorms')); if (s) return { ...JSON.parse(JSON.stringify(DEFAULT_NORMS)), ...s }; } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_NORMS));
}
function toggleNorms() {
  const ed = $('normsEd'); ed.hidden = !ed.hidden; if (ed.hidden) return;
  const labels = {}; MEASURES.forEach(m => labels[m.k] = m.label); labels.WitsF = 'Wits (female)'; labels.WitsM = 'Wits (male)';
  let h = '<b>Measure</b><b>Mean</b><b>Low</b><b>High</b>';
  for (const k of Object.keys(DEFAULT_NORMS))
    h += `<span>${labels[k] || k}</span>` + [0, 1, 2].map(i => `<input data-k="${k}" data-i="${i}" value="${norms[k][i]}" inputmode="decimal">`).join('');
  h += '<button class="btn sm" id="normReset" style="grid-column:1/-1">Restore default norms</button>';
  ed.innerHTML = h;
  ed.querySelectorAll('input').forEach(inp => inp.onchange = () => { const v = parseFloat(inp.value); if (isNaN(v)) return;
    norms[inp.dataset.k][+inp.dataset.i] = v; localStorage.setItem('cephNorms', JSON.stringify(norms)); compute(); });
  $('normReset').onclick = () => { norms = JSON.parse(JSON.stringify(DEFAULT_NORMS)); localStorage.removeItem('cephNorms'); compute(); ed.hidden = true; toggleNorms(); };
}

// ================= infographic viewer =================
let infoId = null;
function openInfo(id) {
  infoId = id; const L = LM[id];
  $('infoImg').src = `assets/info/${id}.jpg`; $('infoImg').alt = `${L.name}: how to find it`;
  $('imDl').href = `assets/info/${id}.jpg`; $('imDl').setAttribute('download', `ceph-trace-${id}.jpg`);
  $('infoModal').hidden = false;
}
function stepInfo(d) { const i = LANDMARKS.findIndex(l => l.id === infoId); openInfo(LANDMARKS[(i + d + LANDMARKS.length) % LANDMARKS.length].id); }
document.addEventListener('DOMContentLoaded', () => {
  $('imClose').onclick = () => $('infoModal').hidden = true;
  $('infoModal').onclick = e => { if (e.target.id === 'infoModal') $('infoModal').hidden = true; };
  $('imPrev').onclick = () => stepInfo(-1); $('imNext').onclick = () => stepInfo(1);
  $('stepInfo').onclick = () => { const L = LANDMARKS[T.cur]; if (L) openInfo(L.id); };
  document.addEventListener('keydown', e => { if ($('infoModal').hidden) return;
    if (e.key === 'Escape') $('infoModal').hidden = true; if (e.key === 'ArrowRight') stepInfo(1); if (e.key === 'ArrowLeft') stepInfo(-1); });
});
