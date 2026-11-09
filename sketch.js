// Ceph Trace — p5.js tracing canvas
let img = null, isDemo = false;
let P = {};                    // landmarks in image coords
let cur = 0;                   // index into LANDMARKS
let view = { s: 1, x: 0, y: 0 };
let mmPerPx = null, calibPts = null, mode = 'trace';
let showLines = true;
let filt = { b: 100, c: 120, inv: false };
let norms = loadNorms();
let sex = 'F';
let undoStack = [];
let results = [];

// pointer state
const ptrs = new Map();
let drag = null, place = null, pinch = null, pan = null;
let loupe = null;              // {sx, sy, ix, iy}

const COLORS = {
  SN: '#4fd1c5', FH: '#f6ad55', MP: '#fc8181', NA: '#9f7aea', NB: '#9f7aea',
  OCC: '#68d391', INC: '#f687b3', FAC: '#63b3ed', Y: '#ecc94b',
};

function setup() {
  const st = document.getElementById('stage');
  const c = createCanvas(st.clientWidth, st.clientHeight);
  c.parent('stage');
  pixelDensity(Math.min(2, displayDensity()));
  textFont('Inter');
  bindPointer(c.elt);
  bindUI();
  updatePanel();
}

function windowResized() {
  const st = document.getElementById('stage');
  resizeCanvas(st.clientWidth, st.clientHeight);
  if (img) fit();
}

// ---------- drawing ----------
function draw() {
  background(5, 8, 11);
  if (!img) return;
  push();
  translate(view.x, view.y); scale(view.s);
  drawScene(view.s, true);
  pop();
  if (loupe) drawLoupe();
  if (mode === 'calib') {
    noStroke(); fill(246, 173, 85); textSize(13); textAlign(LEFT, TOP);
    text('CALIBRATE: tap two points on the ruler (' + (calibPts ? calibPts.length : 0) + '/2)', 12, 12);
  }
}

function drawScene(k, labels) {
  const ctx = drawingContext;
  ctx.save();
  ctx.filter = `brightness(${filt.b}%) contrast(${filt.c}%)` + (filt.inv ? ' invert(1)' : '');
  image(img, 0, 0);
  ctx.restore();
  if (showLines) drawTracing(k);
  // calibration line
  if (calibPts) {
    stroke(246, 173, 85); strokeWeight(2 / k);
    for (const p of calibPts) { noFill(); circle(p.x, p.y, 12 / k); }
    if (calibPts.length === 2) line(calibPts[0].x, calibPts[0].y, calibPts[1].x, calibPts[1].y);
  }
  drawPoints(k, labels);
}

function seg(a, b, col, k, ext = 0, dash = false) {
  if (!a || !b) return;
  const d = { x: b.x - a.x, y: b.y - a.y }, L = Math.hypot(d.x, d.y) || 1;
  const e = ext / k;
  const x1 = a.x - d.x / L * e, y1 = a.y - d.y / L * e, x2 = b.x + d.x / L * e, y2 = b.y + d.y / L * e;
  stroke(col); strokeWeight(1.6 / k);
  drawingContext.setLineDash(dash ? [6 / k, 5 / k] : []);
  line(x1, y1, x2, y2);
  drawingContext.setLineDash([]);
}

function drawTracing(k) {
  const p = P;
  seg(p.S, p.N, COLORS.SN, k, 40);
  seg(p.Po, p.Or, COLORS.FH, k, 60);
  seg(p.N, p.A, COLORS.NA, k, 30);
  seg(p.N, p.B, COLORS.NB, k, 30, true);
  seg(p.Go, p.Me, COLORS.MP, k, 50);
  seg(p.Go, p.Gn, COLORS.MP, k, 0, true);
  seg(p.N, p.Pog, COLORS.FAC, k, 20, true);
  seg(p.S, p.Gn, COLORS.Y, k, 0, true);
  if (p.Mo && p.U1T && p.L1T) seg(p.Mo, mid(p.U1T, p.L1T), COLORS.OCC, k, 50);
  seg(p.U1A, p.U1T, COLORS.INC, k, 25);
  seg(p.L1A, p.L1T, COLORS.INC, k, 25);
  // Wits projections
  if (p.Mo && p.U1T && p.L1T && p.A && p.B) {
    const o = p.Mo, d = unit(V(o, mid(p.U1T, p.L1T)));
    for (const q of [p.A, p.B]) {
      const t = dot(V(o, q), d); const f = { x: o.x + d.x * t, y: o.y + d.y * t };
      seg(q, f, 'rgba(104,211,145,0.6)', k, 0, true);
    }
  }
}

function drawPoints(k, labels) {
  const target = LANDMARKS[cur] && LANDMARKS[cur].id;
  for (const L of LANDMARKS) {
    const p = P[L.id]; if (!p) continue;
    const isCur = L.id === target || (drag && drag.id === L.id);
    noStroke(); fill(0, 0, 0, 150); circle(p.x, p.y, 13 / k);
    fill(isCur ? '#f6ad55' : '#4fd1c5'); circle(p.x, p.y, 7 / k);
    stroke(255); strokeWeight(1 / k); noFill(); circle(p.x, p.y, 13 / k);
    if (labels) {
      noStroke(); textSize(12 / k); textStyle(BOLD); textAlign(LEFT, CENTER);
      fill(0, 0, 0, 170); text(L.id, p.x + 9 / k + 1 / k, p.y + 1 / k);
      fill(255); text(L.id, p.x + 9 / k, p.y);
    }
  }
}

function drawLoupe() {
  const r = Math.min(80, width * 0.2), z = 3;
  const cx = loupe.sx < width / 2 ? width - r - 14 : r + 14, cy = r + 14;
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  background(0);
  translate(cx, cy); scale(view.s * z); translate(-loupe.ix, -loupe.iy);
  drawScene(view.s * z, false);
  ctx.restore();
  resetMatrix();
  noFill(); stroke('#4fd1c5'); strokeWeight(2); circle(cx, cy, r * 2);
  stroke('#f6ad55'); strokeWeight(1);
  line(cx - 12, cy, cx - 4, cy); line(cx + 4, cy, cx + 12, cy);
  line(cx, cy - 12, cx, cy - 4); line(cx, cy + 4, cx, cy + 12);
  noStroke(); fill('#f6ad55'); textSize(11); textAlign(CENTER, TOP); textStyle(BOLD);
  const lab = drag ? drag.id : (mode === 'calib' ? 'Ruler' : (LANDMARKS[cur] ? LANDMARKS[cur].id : ''));
  text(lab, cx, cy + r - 18);
}

// ---------- coords ----------
const toImg = (sx, sy) => ({ x: (sx - view.x) / view.s, y: (sy - view.y) / view.s });
const toScr = (p) => ({ x: p.x * view.s + view.x, y: p.y * view.s + view.y });

function fit() {
  const s = Math.min(width / img.width, height / img.height) * 0.94;
  view.s = s; view.x = (width - img.width * s) / 2; view.y = (height - img.height * s) / 2;
}
function zoomAt(f, sx, sy) {
  const ns = constrain(view.s * f, 0.05, 40);
  const ip = toImg(sx, sy);
  view.s = ns; view.x = sx - ip.x * ns; view.y = sy - ip.y * ns;
}

// ---------- pointer handling ----------
function localXY(e, el) { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

function hitTest(sx, sy) {
  let best = null, bd = 24;
  for (const L of LANDMARKS) {
    const p = P[L.id]; if (!p) continue;
    const q = toScr(p), d = Math.hypot(q.x - sx, q.y - sy);
    if (d < bd) { bd = d; best = L.id; }
  }
  return best;
}

function bindPointer(el) {
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', e => {
    e.preventDefault(); if (!img) return;
    const p = localXY(e, el); zoomAt(Math.exp(-e.deltaY * 0.0015), p.x, p.y);
  }, { passive: false });

  el.addEventListener('pointerdown', e => {
    if (!img) return;
    el.setPointerCapture(e.pointerId);
    const p = localXY(e, el);
    ptrs.set(e.pointerId, p);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      drag = null; place = null; loupe = null; pan = null;
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), m0: mid(a, b), v0: { ...view } };
      return;
    }
    if (e.button === 1 || e.button === 2 || e.shiftKey) { pan = { p0: p, v0: { ...view } }; return; }
    const hit = mode === 'trace' ? hitTest(p.x, p.y) : null;
    if (hit) {
      pushUndo();
      drag = { id: hit, p0: p, q0: { ...P[hit] } };
      loupe = { sx: p.x, sy: p.y, ix: P[hit].x, iy: P[hit].y };
      cur = LANDMARKS.findIndex(L => L.id === hit);
      updatePanel();
    } else if (mode === 'calib' || LANDMARKS[cur]) {
      const ip = toImg(p.x, p.y);
      place = { p0: p };
      loupe = { sx: p.x, sy: p.y, ix: ip.x, iy: ip.y };
    } else {
      pan = { p0: p, v0: { ...view } };
    }
  });

  el.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    const p = localXY(e, el);
    ptrs.set(e.pointerId, p);
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), m = mid(a, b);
      const ns = constrain(pinch.v0.s * d / pinch.d0, 0.05, 40);
      const ix = (pinch.m0.x - pinch.v0.x) / pinch.v0.s, iy = (pinch.m0.y - pinch.v0.y) / pinch.v0.s;
      view.s = ns; view.x = m.x - ix * ns; view.y = m.y - iy * ns;
      return;
    }
    if (pan) { view.x = pan.v0.x + p.x - pan.p0.x; view.y = pan.v0.y + p.y - pan.p0.y; return; }
    if (drag) {
      // relative drag: finger never hides the point
      P[drag.id] = { x: drag.q0.x + (p.x - drag.p0.x) / view.s, y: drag.q0.y + (p.y - drag.p0.y) / view.s };
      loupe = { sx: p.x, sy: p.y, ix: P[drag.id].x, iy: P[drag.id].y };
      compute();
      return;
    }
    if (place) { const ip = toImg(p.x, p.y); loupe = { sx: p.x, sy: p.y, ix: ip.x, iy: ip.y }; }
  });

  const end = e => {
    if (!ptrs.has(e.pointerId)) return;
    const p = localXY(e, el);
    ptrs.delete(e.pointerId);
    if (pinch) { if (ptrs.size < 2) pinch = null; return; }
    if (place) {
      const ip = toImg(p.x, p.y);
      if (mode === 'calib') addCalib(ip);
      else if (LANDMARKS[cur]) {
        pushUndo();
        P[LANDMARKS[cur].id] = ip;
        advance();
      }
    }
    if (drag) { compute(); updatePanel(); }
    drag = null; place = null; pan = null; loupe = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  window.addEventListener('keydown', e => {
    if (!img || e.target.tagName === 'INPUT') return;
    const id = LANDMARKS[cur] && LANDMARKS[cur].id;
    const step = (e.shiftKey ? 5 : 0.5) / Math.max(view.s, 0.2);
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv && id && P[id]) { e.preventDefault(); P[id] = { x: P[id].x + mv[0] * step, y: P[id].y + mv[1] * step }; compute(); }
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && id && P[id]) { pushUndo(); delete P[id]; compute(); updatePanel(); }
  });
}

function advance() {
  const next = LANDMARKS.findIndex((L, i) => i > cur && !P[L.id]);
  const any = LANDMARKS.findIndex(L => !P[L.id]);
  cur = next >= 0 ? next : (any >= 0 ? any : LANDMARKS.length);
  compute(); updatePanel();
  if (cur >= LANDMARKS.length) toast('All landmarks placed. Drag any point to refine.');
}

function addCalib(ip) {
  calibPts.push(ip);
  if (calibPts.length === 2) {
    const px = Math.hypot(calibPts[1].x - calibPts[0].x, calibPts[1].y - calibPts[0].y);
    setTimeout(() => {
      const mm = parseFloat(prompt('Distance between the two points in mm (as on the ruler):', '10'));
      if (mm > 0 && px > 0) { mmPerPx = mm / px; toast('Calibrated: ' + (1 / mmPerPx).toFixed(2) + ' px/mm'); }
      else { calibPts = null; }
      mode = 'trace'; setBtn('calib', false); compute(); updatePanel();
    }, 30);
  }
}

// ---------- undo ----------
function pushUndo() { undoStack.push(JSON.stringify({ P, cur })); if (undoStack.length > 80) undoStack.shift(); }
function undo() {
  const s = undoStack.pop(); if (!s) return toast('Nothing to undo');
  const o = JSON.parse(s); P = o.P; cur = o.cur; compute(); updatePanel();
}

// ---------- analysis + panel ----------
function compute() { results = runAnalysis(P, norms, mmPerPx, sex); renderResults(); }

function fmt(v, u) { return v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1) + (u === '°' ? '°' : ' mm'); }

function renderResults() {
  const box = document.getElementById('results');
  let html = '<table>', g = '';
  for (const r of results) {
    if (r.g !== g) { g = r.g; html += `<tr><th colspan="3">${g}</th></tr>`; }
    const n = r.norm, nTxt = `${n[0]}${r.u === '°' ? '°' : ''} (${n[1]} to ${n[2]})`;
    html += `<tr class="s-${r.status}"><td>${r.label}${r.note ? `<span class="note">${r.note}</span>` : ''}</td>` +
            `<td class="v">${fmt(r.val, r.u)}</td><td class="n">${nTxt}</td></tr>`;
  }
  box.innerHTML = html + '</table>';
}

function updatePanel() {
  const L = LANDMARKS[cur];
  const placed = LANDMARKS.filter(l => P[l.id]).length;
  document.getElementById('stepNo').textContent = `${placed} / ${LANDMARKS.length} placed`;
  document.getElementById('stepName').textContent = L ? `${L.id} — ${L.name}` : 'Tracing complete';
  document.getElementById('stepHint').textContent = L ? L.hint : 'Drag any point to refine. Tap a chip to re-place a landmark.';
  const cs = document.getElementById('calibState');
  cs.textContent = mmPerPx ? `${(1 / mmPerPx).toFixed(1)} px/mm` : 'Not calibrated';
  cs.className = 'pill' + (mmPerPx ? ' ok' : '');
  document.getElementById('chips').innerHTML = LANDMARKS.map((l, i) =>
    `<button class="chip ${P[l.id] ? 'done' : ''} ${i === cur ? 'cur' : ''}" data-i="${i}">${l.id}</button>`).join('');
  document.querySelectorAll('.chip').forEach(c => c.onclick = () => { cur = +c.dataset.i; updatePanel(); focusOn(LANDMARKS[cur].id); });
}

function focusOn(id) {
  if (!P[id]) return;
  const q = toScr(P[id]);
  if (q.x < 0 || q.y < 0 || q.x > width || q.y > height) { view.x += width / 2 - q.x; view.y += height / 2 - q.y; }
}

// ---------- UI wiring ----------
function setBtn(act, on) { document.querySelectorAll(`[data-act="${act}"]`).forEach(b => b.classList.toggle('on', on)); }
let toastT;
function toast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

function bindUI() {
  document.querySelectorAll('.fileIn').forEach(inp => inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => loadImage(rd.result, im => { startWith(im, false); });
    rd.readAsDataURL(f); e.target.value = '';
  });
  const acts = {
    demo: () => loadDemo(),
    fit: () => img && fit(),
    zin: () => img && zoomAt(1.4, width / 2, height / 2),
    zout: () => img && zoomAt(1 / 1.4, width / 2, height / 2),
    lines: () => { showLines = !showLines; setBtn('lines', showLines); },
    undo: () => undo(),
    prev: () => { cur = Math.max(0, Math.min(cur, LANDMARKS.length) - 1); updatePanel(); },
    next: () => { cur = Math.min(LANDMARKS.length, cur + 1); updatePanel(); },
    skip: () => { if (LANDMARKS[cur]) { delete P[LANDMARKS[cur].id]; } advanceSkip(); },
    calib: () => { if (!img) return; mode = mode === 'calib' ? 'trace' : 'calib'; calibPts = mode === 'calib' ? [] : calibPts; setBtn('calib', mode === 'calib');
      if (mode === 'calib') toast('Tap two points on the ruler, then enter the mm'); },
    reset: () => { if (!confirm('Clear all landmarks and calibration?')) return; pushUndo(); P = {}; cur = 0; mmPerPx = null; calibPts = null; compute(); updatePanel(); },
    png: () => exportPNG(),
    csv: () => exportCSV(),
    norms: () => toggleNorms(),
  };
  document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => acts[b.dataset.act] && acts[b.dataset.act]()));
  setBtn('lines', true);
  document.getElementById('bri').oninput = e => filt.b = +e.target.value;
  document.getElementById('con').oninput = e => filt.c = +e.target.value;
  document.getElementById('inv').onchange = e => filt.inv = e.target.checked;
  document.getElementById('sex').onchange = e => { sex = e.target.value; compute(); };
  compute();
}

function advanceSkip() { cur = Math.min(LANDMARKS.length, cur + 1); compute(); updatePanel(); }

function startWith(im, demo) {
  img = im; isDemo = demo; P = {}; cur = 0; mmPerPx = null; calibPts = null; undoStack = [];
  document.getElementById('empty').classList.add('hide');
  fit(); compute(); updatePanel();
  toast(demo ? 'Demo loaded: drag points to see values change' : 'Tap to place ' + LANDMARKS[0].name + '. Pinch to zoom.');
}

// ---------- demo ----------
function loadDemo() {
  const g = createGraphics(1000, 1100);
  g.background(14, 20, 26);
  g.stroke(30, 44, 56); g.strokeWeight(1);
  for (let i = 0; i <= 1000; i += 50) g.line(i, 0, i, 1100);
  for (let j = 0; j <= 1100; j += 50) g.line(0, j, 1000, j);
  // simple soft-tissue / skull silhouette for orientation
  g.noFill(); g.stroke(70, 95, 115); g.strokeWeight(3);
  g.beginShape();
  [[300,150],[520,140],[640,250],[665,345],[700,420],[730,520],[690,560],[700,640],[690,700],[700,760],[680,830],[675,900],[640,960],[560,985],[420,960],[330,860]]
    .forEach(([x, y]) => g.curveVertex(x, y));
  g.endShape();
  g.noStroke(); g.fill(90, 120, 140); g.textSize(22); g.textAlign(g.CENTER);
  g.text('DEMO — upload your own ceph', 500, 1070);
  startWith(g, true);
  P = {
    S: {x:380,y:380}, N: {x:640,y:350}, Po: {x:250,y:470}, Or: {x:592,y:452},
    A: {x:632,y:600}, B: {x:610,y:800}, Pog: {x:622,y:878}, Gn: {x:606,y:922}, Me: {x:580,y:942},
    Go: {x:332,y:812}, U1T: {x:655,y:712}, U1A: {x:606,y:575}, U1L: {x:668,y:678},
    L1T: {x:646,y:704}, L1A: {x:585,y:845}, L1L: {x:652,y:735}, Mo: {x:500,y:688},
  };
  mmPerPx = 0.1; cur = LANDMARKS.length; compute(); updatePanel();
}

// ---------- export ----------
function exportCSV() {
  if (!results.length) return;
  const rows = [['Group', 'Measurement', 'Value', 'Unit', 'Norm', 'Range low', 'Range high', 'Interpretation']];
  for (const r of results) rows.push([r.g, r.label, r.val == null ? '' : r.val.toFixed(1), r.u, r.norm[0], r.norm[1], r.norm[2], r.note]);
  rows.push([]); rows.push(['Landmark', 'x (px)', 'y (px)']);
  for (const L of LANDMARKS) if (P[L.id]) rows.push([L.id, P[L.id].x.toFixed(1), P[L.id].y.toFixed(1)]);
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  download(new Blob([csv], { type: 'text/csv' }), 'ceph-trace-analysis.csv');
}

function exportPNG() {
  if (!img) return toast('Upload a ceph first');
  const W = img.width, H = img.height, tw = 760;
  const rowsH = 70 + results.length * 30 + 120;
  const g = createGraphics(W + tw, Math.max(H, rowsH));
  g.pixelDensity(1);
  g.background(11, 15, 20);
  g.drawingContext.filter = `brightness(${filt.b}%) contrast(${filt.c}%)` + (filt.inv ? ' invert(1)' : '');
  g.image(img, 0, 0);
  g.drawingContext.filter = 'none';
  // tracing on export
  const k = Math.max(1, Math.min(W, H) / 900);
  const gs = (a, b, col, dash) => { if (!a || !b) return; g.stroke(col); g.strokeWeight(2.2 * k);
    g.drawingContext.setLineDash(dash ? [8 * k, 6 * k] : []); g.line(a.x, a.y, b.x, b.y); g.drawingContext.setLineDash([]); };
  gs(P.S, P.N, COLORS.SN); gs(P.Po, P.Or, COLORS.FH); gs(P.N, P.A, COLORS.NA); gs(P.N, P.B, COLORS.NB, true);
  gs(P.Go, P.Me, COLORS.MP); gs(P.N, P.Pog, COLORS.FAC, true); gs(P.S, P.Gn, COLORS.Y, true);
  gs(P.U1A, P.U1T, COLORS.INC); gs(P.L1A, P.L1T, COLORS.INC);
  if (P.Mo && P.U1T && P.L1T) gs(P.Mo, mid(P.U1T, P.L1T), COLORS.OCC);
  for (const L of LANDMARKS) { const p = P[L.id]; if (!p) continue;
    g.noStroke(); g.fill('#4fd1c5'); g.circle(p.x, p.y, 9 * k);
    g.fill(255); g.textSize(14 * k); g.textStyle(g.BOLD); g.text(L.id, p.x + 9 * k, p.y + 5 * k); }
  // table
  let y = 50; const x = W + 30;
  g.noStroke(); g.fill('#4fd1c5'); g.textSize(30); g.textStyle(g.BOLD); g.textAlign(g.LEFT, g.BASELINE);
  g.text('Ceph Trace — Analysis', x, y); y += 36;
  let grp = '';
  for (const r of results) {
    if (r.g !== grp) { grp = r.g; y += 10; g.fill('#f6ad55'); g.textSize(15); g.text(grp.toUpperCase(), x, y); y += 24; }
    g.textSize(16); g.textStyle(g.NORMAL); g.fill(230, 237, 245); g.text(r.label, x, y);
    const col = { ok: '#48bb78', low: '#63b3ed', high: '#fc8181', calib: '#f6ad55' }[r.status] || '#4a5a6c';
    g.fill(col); g.textStyle(g.BOLD); g.text(fmt(r.val, r.u), x + 300, y);
    g.fill(138, 155, 176); g.textStyle(g.NORMAL); g.textSize(13);
    g.text(`${r.norm[0]} (${r.norm[1]}–${r.norm[2]})`, x + 400, y);
    g.fill(col); g.text(r.note || '', x + 530, y);
    y += 26;
  }
  y += 20; g.fill(138, 155, 176); g.textSize(12);
  g.text('Educational aid. Verify landmarks and values clinically.', x, y);
  g.text('Built by Swapnil Agrawal (BDS intern) · ' + new Date().toLocaleDateString(), x, y + 18);
  g.elt.toBlob(b => download(b, 'ceph-trace.png'), 'image/png');
}

function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------- norms ----------
function loadNorms() {
  try { const s = JSON.parse(localStorage.getItem('cephNorms')); if (s) return { ...DEFAULT_NORMS, ...s }; } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_NORMS));
}
function toggleNorms() {
  const ed = document.getElementById('normsEd');
  ed.hidden = !ed.hidden; if (ed.hidden) return;
  const labels = {}; MEASURES.forEach(m => labels[m.k] = m.label);
  labels.WitsF = 'Wits (female)'; labels.WitsM = 'Wits (male)';
  let h = '<b>Measure</b><b>Mean</b><b>Low</b><b>High</b>';
  for (const k of Object.keys(DEFAULT_NORMS)) {
    h += `<span>${labels[k] || k}</span>` + [0, 1, 2].map(i => `<input data-k="${k}" data-i="${i}" value="${norms[k][i]}" inputmode="decimal">`).join('');
  }
  h += '<button class="btn sm" id="normReset" style="grid-column:1/-1">Restore default norms</button>';
  ed.innerHTML = h;
  ed.querySelectorAll('input').forEach(inp => inp.onchange = () => {
    const v = parseFloat(inp.value); if (isNaN(v)) return;
    norms[inp.dataset.k][+inp.dataset.i] = v; localStorage.setItem('cephNorms', JSON.stringify(norms)); compute();
  });
  document.getElementById('normReset').onclick = () => { norms = JSON.parse(JSON.stringify(DEFAULT_NORMS)); localStorage.removeItem('cephNorms'); compute(); ed.hidden = true; toggleNorms(); };
}
