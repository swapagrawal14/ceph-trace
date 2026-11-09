// Ceph Trace — landmark definitions and cephalometric analysis
// Educational aid. Norms are editable in the app; verify clinically.

const LANDMARKS = [
  { id: 'S',   name: 'Sella',              hint: 'Geometric centre of the sella turcica' },
  { id: 'N',   name: 'Nasion',             hint: 'Most anterior point of the frontonasal suture' },
  { id: 'Po',  name: 'Porion',             hint: 'Most superior point of the external auditory meatus' },
  { id: 'Or',  name: 'Orbitale',           hint: 'Lowest point on the inferior margin of the orbit' },
  { id: 'A',   name: 'Point A (Subspinale)', hint: 'Deepest point on the anterior maxillary concavity, between ANS and prosthion' },
  { id: 'B',   name: 'Point B (Supramentale)', hint: 'Deepest point on the anterior mandibular concavity, between infradentale and pogonion' },
  { id: 'Pog', name: 'Pogonion',           hint: 'Most anterior point of the bony chin' },
  { id: 'Gn',  name: 'Gnathion',           hint: 'Most antero-inferior point on the symphysis, midway between Pog and Me' },
  { id: 'Me',  name: 'Menton',             hint: 'Lowest point on the symphyseal outline' },
  { id: 'Go',  name: 'Gonion',             hint: 'Most postero-inferior point at the angle of the mandible (bisect ramus & lower-border tangents)' },
  { id: 'U1T', name: 'Upper incisor tip',  hint: 'Incisal edge of the most prominent maxillary central incisor' },
  { id: 'U1A', name: 'Upper incisor apex', hint: 'Root apex of the same maxillary central incisor' },
  { id: 'U1L', name: 'Upper incisor labial', hint: 'Most labial point of the maxillary incisor crown' },
  { id: 'L1T', name: 'Lower incisor tip',  hint: 'Incisal edge of the most prominent mandibular central incisor' },
  { id: 'L1A', name: 'Lower incisor apex', hint: 'Root apex of the same mandibular central incisor' },
  { id: 'L1L', name: 'Lower incisor labial', hint: 'Most labial point of the mandibular incisor crown' },
  { id: 'Mo',  name: 'Molar occlusion',    hint: 'Overlap of the mesial cusps of the first molars (functional occlusal plane)' },
];

// mean, lo, hi. lo/hi = commonly quoted normal range. Editable in app.
const DEFAULT_NORMS = {
  SNA: [82, 80, 84], SNB: [80, 78, 82], ANB: [2, 0, 4],
  SNGoGn: [32, 27, 37], OccSN: [14, 11, 17],
  U1NAdeg: [22, 19, 25], U1NAmm: [4, 2, 6],
  L1NBdeg: [25, 22, 28], L1NBmm: [4, 2, 6],
  U1SN: [102, 97, 107], Interincisal: [130, 124, 136],
  Facial: [87.8, 82, 95], Convexity: [0, -8.5, 10], ABplane: [-4.6, -9, 0],
  Yaxis: [59.4, 53, 66], FHOcc: [9.3, 1.5, 14], U1APog: [2.7, -1, 5],
  FMA: [25, 20, 30], IMPA: [90, 85, 95], FMIA: [65, 60, 70],
  WitsF: [0, -2, 2], WitsM: [-1, -3, 1],
};

const V = (a, b) => ({ x: b.x - a.x, y: b.y - a.y });
const len = (u) => Math.hypot(u.x, u.y);
const unit = (u) => { const l = len(u) || 1; return { x: u.x / l, y: u.y / l }; };
const dot = (u, w) => u.x * w.x + u.y * w.y;
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
function angBetween(u, w) {
  const c = dot(u, w) / ((len(u) * len(w)) || 1);
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
}
function lineAng(u, w) { const a = angBetween(u, w); return a > 90 ? 180 - a : a; }

// Anterior unit vector: along FH (Po→Or) if present, else S→N
function anteriorDir(P) {
  if (P.Po && P.Or) return unit(V(P.Po, P.Or));
  if (P.S && P.N) return unit(V(P.S, P.N));
  return { x: 1, y: 0 };
}
// Signed perpendicular distance of p from line a-b; + when p is anterior
function perpSigned(p, a, b, ant) {
  const d = unit(V(a, b));
  let n = { x: -d.y, y: d.x };
  if (dot(n, ant) < 0) n = { x: -n.x, y: -n.y };
  return dot(V(a, p), n);
}

// Each measure: group, key (norm), label, unit, needs, fn, low/high meaning
const MEASURES = [
  // Steiner
  { g: 'Steiner', k: 'SNA', label: 'SNA', u: '°', needs: ['S','N','A'],
    fn: P => angBetween(V(P.N, P.S), V(P.N, P.A)), lo: 'Retrognathic maxilla', hi: 'Prognathic maxilla' },
  { g: 'Steiner', k: 'SNB', label: 'SNB', u: '°', needs: ['S','N','B'],
    fn: P => angBetween(V(P.N, P.S), V(P.N, P.B)), lo: 'Retrognathic mandible', hi: 'Prognathic mandible' },
  { g: 'Steiner', k: 'ANB', label: 'ANB', u: '°', needs: ['S','N','A','B'],
    fn: P => angBetween(V(P.N, P.S), V(P.N, P.A)) - angBetween(V(P.N, P.S), V(P.N, P.B)),
    lo: 'Class III skeletal tendency', hi: 'Class II skeletal tendency' },
  { g: 'Steiner', k: 'SNGoGn', label: 'SN – GoGn', u: '°', needs: ['S','N','Go','Gn'],
    fn: P => lineAng(V(P.S, P.N), V(P.Go, P.Gn)), lo: 'Horizontal growth pattern', hi: 'Vertical growth pattern' },
  { g: 'Steiner', k: 'OccSN', label: 'Occlusal plane – SN', u: '°', needs: ['S','N','Mo','U1T','L1T'],
    fn: P => lineAng(V(P.S, P.N), V(P.Mo, mid(P.U1T, P.L1T))), lo: 'Flat occlusal plane', hi: 'Steep occlusal plane' },
  { g: 'Steiner', k: 'U1NAdeg', label: 'U1 – NA (angle)', u: '°', needs: ['N','A','U1T','U1A'],
    fn: P => lineAng(V(P.N, P.A), V(P.U1A, P.U1T)), lo: 'Retroclined upper incisor', hi: 'Proclined upper incisor' },
  { g: 'Steiner', k: 'U1NAmm', label: 'U1 – NA (linear)', u: 'mm', lin: true, needs: ['N','A','U1L'],
    fn: (P, ant) => perpSigned(P.U1L, P.N, P.A, ant), lo: 'Retruded upper incisor', hi: 'Protruded upper incisor' },
  { g: 'Steiner', k: 'L1NBdeg', label: 'L1 – NB (angle)', u: '°', needs: ['N','B','L1T','L1A'],
    fn: P => lineAng(V(P.N, P.B), V(P.L1A, P.L1T)), lo: 'Retroclined lower incisor', hi: 'Proclined lower incisor' },
  { g: 'Steiner', k: 'L1NBmm', label: 'L1 – NB (linear)', u: 'mm', lin: true, needs: ['N','B','L1L'],
    fn: (P, ant) => perpSigned(P.L1L, P.N, P.B, ant), lo: 'Retruded lower incisor', hi: 'Protruded lower incisor' },
  { g: 'Steiner', k: 'Interincisal', label: 'Interincisal angle', u: '°', needs: ['U1T','U1A','L1T','L1A'],
    fn: P => angBetween(V(P.U1T, P.U1A), V(P.L1T, P.L1A)), lo: 'Bimaxillary proclination', hi: 'Upright incisors' },
  { g: 'Steiner', k: 'U1SN', label: 'U1 – SN', u: '°', needs: ['S','N','U1T','U1A'],
    fn: P => angBetween(V(P.N, P.S), V(P.U1A, P.U1T)), lo: 'Retroclined upper incisor', hi: 'Proclined upper incisor' },
  // Downs
  { g: 'Downs', k: 'Facial', label: 'Facial angle (FH – NPog)', u: '°', needs: ['Po','Or','N','Pog'],
    fn: P => angBetween(V(P.Or, P.Po), V(P.N, P.Pog)), lo: 'Retrusive chin', hi: 'Prognathic chin' },
  { g: 'Downs', k: 'Convexity', label: 'Angle of convexity', u: '°', needs: ['N','A','Pog'],
    fn: (P, ant) => { const a = 180 - angBetween(V(P.A, P.N), V(P.A, P.Pog));
      return perpSigned(P.A, P.N, P.Pog, ant) >= 0 ? a : -a; }, lo: 'Concave profile', hi: 'Convex profile' },
  { g: 'Downs', k: 'ABplane', label: 'A–B plane angle', u: '°', needs: ['A','B','N','Pog'],
    fn: (P, ant) => { const a = lineAng(V(P.A, P.B), V(P.N, P.Pog));
      return dot(V(P.A, P.B), ant) < 0 ? -a : a; }, lo: 'Class II jaw relation', hi: 'Class III jaw relation' },
  { g: 'Downs', k: 'Yaxis', label: 'Y-axis (FH – SGn)', u: '°', needs: ['Po','Or','S','Gn'],
    fn: P => angBetween(V(P.Po, P.Or), V(P.S, P.Gn)), lo: 'Horizontal growth', hi: 'Vertical growth' },
  { g: 'Downs', k: 'FHOcc', label: 'Cant of occlusal plane', u: '°', needs: ['Po','Or','Mo','U1T','L1T'],
    fn: P => lineAng(V(P.Po, P.Or), V(P.Mo, mid(P.U1T, P.L1T))), lo: 'Flat', hi: 'Steep' },
  { g: 'Downs', k: 'U1APog', label: 'U1 – APog', u: 'mm', lin: true, needs: ['A','Pog','U1T'],
    fn: (P, ant) => perpSigned(P.U1T, P.A, P.Pog, ant), lo: 'Retruded upper incisor', hi: 'Protruded upper incisor' },
  // Tweed
  { g: 'Tweed', k: 'FMA', label: 'FMA (FH – MP)', u: '°', needs: ['Po','Or','Go','Me'],
    fn: P => lineAng(V(P.Po, P.Or), V(P.Go, P.Me)), lo: 'Low angle / horizontal', hi: 'High angle / vertical' },
  { g: 'Tweed', k: 'IMPA', label: 'IMPA (L1 – MP)', u: '°', needs: ['Go','Me','L1T','L1A'],
    fn: P => angBetween(V(P.Me, P.Go), V(P.L1A, P.L1T)), lo: 'Retroclined lower incisor', hi: 'Proclined lower incisor' },
  { g: 'Tweed', k: 'FMIA', label: 'FMIA', u: '°', needs: ['Po','Or','Go','Me','L1T','L1A'],
    fn: P => 180 - lineAng(V(P.Po, P.Or), V(P.Go, P.Me)) - angBetween(V(P.Me, P.Go), V(P.L1A, P.L1T)),
    lo: 'Proclined lower incisor', hi: 'Upright lower incisor' },
  // Wits
  { g: 'Wits', k: 'Wits', label: 'Wits appraisal (AO – BO)', u: 'mm', lin: true, needs: ['A','B','Mo','U1T','L1T'],
    fn: P => { const o = P.Mo, d = unit(V(o, mid(P.U1T, P.L1T)));
      return dot(V(o, P.A), d) - dot(V(o, P.B), d); }, lo: 'Class III jaw relation', hi: 'Class II jaw relation' },
];

function runAnalysis(P, norms, mmPerPx, sex) {
  const ant = anteriorDir(P);
  return MEASURES.map(m => {
    const key = m.k === 'Wits' ? (sex === 'M' ? 'WitsM' : 'WitsF') : m.k;
    const norm = norms[key];
    const ok = m.needs.every(id => P[id]);
    let val = null, status = 'na', note = '';
    if (ok) {
      val = m.fn(P, ant);
      if (m.lin) {
        if (mmPerPx) val = val * mmPerPx; else { status = 'calib'; note = 'Calibrate for mm'; }
      }
      if (status !== 'calib') {
        if (val < norm[1]) { status = 'low'; note = m.lo; }
        else if (val > norm[2]) { status = 'high'; note = m.hi; }
        else { status = 'ok'; note = 'Within norm'; }
      }
    }
    return { ...m, key, norm, val, status, note };
  });
}
