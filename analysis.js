// Ceph Trace — landmarks, learning content and cephalometric analysis
// Educational aid. Norms are editable in the app; verify every value clinically.

// group: where the landmark lives. def: textbook definition. find: how to actually spot it.
// why: what it feeds into. trick: a memory hook.
const LANDMARKS = [
  { id: 'S', name: 'Sella', group: 'Cranial base',
    def: 'Centre of the sella turcica, the bony cup that holds the pituitary gland.',
    find: 'Look at the skull base, just above the dark sphenoid sinus. Find the round "cup" and eyeball its centre, not its floor.',
    why: 'Back end of the S–N line, the cranial base reference for SNA, SNB and SN–GoGn.',
    trick: '"Sella turcica" means Turkish saddle. Sit in the middle of the saddle.' },
  { id: 'N', name: 'Nasion', group: 'Cranial base',
    def: 'Most anterior point of the frontonasal suture in the midsagittal plane.',
    find: 'Run down the forehead bone to where it meets the nasal bones. The suture usually sits at the deepest point of that bony curve.',
    why: 'Front end of S–N. Every Steiner angle hinges here (SNA, SNB, NA, NB).',
    trick: 'Bony bridge of the nose. Ignore the soft tissue in front of it.' },
  { id: 'Or', name: 'Orbitale', group: 'Cranial base',
    def: 'Lowest point on the inferior margin of the orbit.',
    find: 'Follow the curved orbital rim down to its lowest point. If the two orbits show as a double outline, take the midpoint.',
    why: 'Front end of the Frankfort horizontal (FH), used for FMA, facial angle and Y-axis.',
    trick: 'Or = Orbit floor.' },
  { id: 'Po', name: 'Porion', group: 'Cranial base',
    def: 'Most superior point of the external auditory meatus.',
    find: 'Find the ear rod ring behind the condyle. Anatomical porion is the top of the meatus; if it is unclear, the top of the ear rod (machine porion) is commonly used.',
    why: 'Back end of the Frankfort horizontal.',
    trick: 'Po–Or together make FH: Frankfort runs from ear to eye.' },
  { id: 'A', name: 'Point A', group: 'Maxilla',
    def: 'Subspinale: deepest point on the anterior maxillary concavity, between ANS and prosthion.',
    find: 'Trace the front of the maxilla from ANS down to the alveolar crest over the upper incisor. Pick the deepest point of that curve, just in front of the incisor root.',
    why: 'Marks the front of the maxillary base: SNA, ANB, Wits, convexity, A–B plane.',
    trick: 'A is Above (maxilla), B is Below (mandible).' },
  { id: 'B', name: 'Point B', group: 'Mandible',
    def: 'Supramentale: deepest point on the anterior mandibular concavity, between infradentale and pogonion.',
    find: 'Trace the front of the mandible from the lower incisor alveolar crest down to the chin. Pick the deepest point of the curve.',
    why: 'Marks the front of the mandibular base: SNB, ANB, Wits, A–B plane.',
    trick: 'B for Below, and it sits in the "dip" above the chin button.' },
  { id: 'Pog', name: 'Pogonion', group: 'Mandible',
    def: 'Most anterior point on the bony chin.',
    find: 'Imagine a line from Nasion touching the chin. Where it just kisses the bone is Pog.',
    why: 'Facial angle, angle of convexity, A–Pog line.',
    trick: 'Pog = Point Of the chin, most forward.' },
  { id: 'Gn', name: 'Gnathion', group: 'Mandible',
    def: 'Most anterior-inferior point on the symphysis, midway between Pogonion and Menton.',
    find: 'Go around the chin curve from Pog to Me and stop halfway, at the "corner" of the chin.',
    why: 'S–Gn (Y-axis) and Go–Gn (Steiner mandibular plane).',
    trick: 'Gn sits between Pog (front) and Me (bottom): front, corner, bottom.' },
  { id: 'Me', name: 'Menton', group: 'Mandible',
    def: 'Lowest point on the symphyseal outline.',
    find: 'Lowest point of the chin outline, on the bony cortex.',
    why: 'Front end of the Go–Me mandibular plane: FMA, IMPA, FMIA.',
    trick: 'Me = bottom of the chin, like the floor under "me".' },
  { id: 'Go', name: 'Gonion', group: 'Mandible',
    def: 'Most posterior-inferior point on the angle of the mandible.',
    find: 'Draw tangents to the back of the ramus and to the lower border. Bisect the angle they make; where the bisector meets the angle outline is Go. If the angle is doubled, take the midpoint.',
    why: 'Back end of the mandibular plane.',
    trick: 'Go = the corner where the jaw "goes" up into the ramus.' },
  { id: 'U1T', name: 'Upper incisor tip', group: 'Teeth',
    def: 'Incisal edge of the most prominent maxillary central incisor.',
    find: 'Pick the most forward upper central incisor and mark its incisal edge.',
    why: 'Upper incisor long axis (U1–SN, U1–NA, interincisal) and U1–APog.',
    trick: 'Always trace the most prominent incisor.' },
  { id: 'U1A', name: 'Upper incisor apex', group: 'Teeth',
    def: 'Root apex of the same maxillary central incisor.',
    find: 'Follow the root up inside the alveolus. If the apex is faint, continue the long axis: the root is longer than the crown.',
    why: 'Tip + apex make the long axis, so inclination depends on this point.',
    trick: 'Tip and apex are a pair. Get the axis right, not just the dots.' },
  { id: 'U1L', name: 'Upper incisor labial', group: 'Teeth',
    def: 'Most labial point of the upper incisor crown.',
    find: 'Most forward point on the labial surface of the crown.',
    why: 'Linear U1–NA (mm): how far the incisor sits in front of NA.',
    trick: 'Labial = lip side. The bulge that touches the lip.' },
  { id: 'L1T', name: 'Lower incisor tip', group: 'Teeth',
    def: 'Incisal edge of the most prominent mandibular central incisor.',
    find: 'Usually just behind the upper incisor tip in a normal overjet.',
    why: 'Lower incisor long axis: L1–NB, IMPA, FMIA, interincisal.',
    trick: 'Same as U1, just below and behind.' },
  { id: 'L1A', name: 'Lower incisor apex', group: 'Teeth',
    def: 'Root apex of the same mandibular central incisor.',
    find: 'Follow the root down inside the symphysis, between the labial and lingual cortices.',
    why: 'Completes the lower incisor long axis.',
    trick: 'The apex should sit inside the symphysis, not poking out of it.' },
  { id: 'L1L', name: 'Lower incisor labial', group: 'Teeth',
    def: 'Most labial point of the lower incisor crown.',
    find: 'Most forward point on the labial surface of the lower crown.',
    why: 'Linear L1–NB (mm).',
    trick: 'Lip-side bulge of the lower incisor.' },
  { id: 'Pm', name: 'Premolar occlusion', group: 'Teeth',
    def: 'Overlap of the cusps of the first premolars.',
    find: 'Where the upper and lower first premolar cusps meet on the occlusal line.',
    why: 'With the molar point it forms the functional occlusal plane used for Wits.',
    trick: 'Functional occlusal plane = through premolars and molars, not incisors.' },
  { id: 'Mo', name: 'Molar occlusion', group: 'Teeth',
    def: 'Overlap of the mesial cusps of the first molars.',
    find: 'Where the mesial cusps of the upper and lower first molars meet.',
    why: 'Occlusal plane (Steiner, Downs) and functional occlusal plane (Wits).',
    trick: 'First molars, mesial cusps: the anchor of the bite.' },
];

// Teaching notes for each measurement: what it is and how to read it.
const MEANING = {
  SNA: 'Where the maxilla sits relative to the cranial base.',
  SNB: 'Where the mandible sits relative to the cranial base.',
  ANB: 'How the jaws relate to each other. Positive = maxilla ahead of mandible.',
  SNGoGn: 'Steepness of the mandible against the cranial base. Tells the growth pattern.',
  OccSN: 'Tilt of the occlusal plane against the cranial base.',
  U1NAdeg: 'Upper incisor tilt relative to the maxilla.',
  U1NAmm: 'How far forward the upper incisor sits in front of NA.',
  L1NBdeg: 'Lower incisor tilt relative to the mandible.',
  L1NBmm: 'How far forward the lower incisor sits in front of NB.',
  Interincisal: 'Angle between upper and lower incisors. Smaller = more proclined.',
  U1SN: 'Upper incisor tilt against the cranial base.',
  Facial: 'Chin position against Frankfort. Bigger = chin more forward.',
  Convexity: 'How convex the bony profile is at Point A.',
  ABplane: 'A–B line against the facial plane. More negative = Class II jaws.',
  Yaxis: 'Direction of chin growth. Bigger = more downward growth.',
  FHOcc: 'Tilt of the occlusal plane against Frankfort.',
  U1APog: 'Upper incisor tip in front of the A–Pog line.',
  FMA: 'Steepness of the mandibular plane against Frankfort.',
  IMPA: 'Lower incisor tilt on the mandibular plane.',
  FMIA: 'Lower incisor against Frankfort. Tweed\'s key to a balanced face.',
  Wits: 'Jaw relation measured on the bite plane, free of cranial base tilt.',
};

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
// Occlusal plane (Steiner / Downs): first molar overlap to incisor overbite midpoint
const occPlane = P => V(P.Mo, mid(P.U1T, P.L1T));

// Each measure: group, key (norm), label, unit, needs, fn, low/high meaning
const MEASURES = [
  // Steiner
  { g: 'Steiner', k: 'SNA', label: 'SNA', u: '°', needs: ['S','N','A'],
    fn: P => angBetween(V(P.N, P.S), V(P.N, P.A)), lo: 'Retrognathic maxilla', hi: 'Prognathic maxilla' },
  { g: 'Steiner', k: 'SNB', label: 'SNB', u: '°', needs: ['S','N','B'],
    fn: P => angBetween(V(P.N, P.S), V(P.N, P.B)), lo: 'Retrognathic mandible', hi: 'Prognathic mandible' },
  { g: 'Steiner', k: 'ANB', label: 'ANB', u: '°', needs: ['S','N','A','B'],
    fn: (P, ant) => { const a = angBetween(V(P.N, P.A), V(P.N, P.B));
      return dot(V(P.B, P.A), ant) >= 0 ? a : -a; },
    lo: 'Class III skeletal tendency', hi: 'Class II skeletal tendency' },
  { g: 'Steiner', k: 'SNGoGn', label: 'SN – GoGn', u: '°', needs: ['S','N','Go','Gn'],
    fn: P => lineAng(V(P.S, P.N), V(P.Go, P.Gn)), lo: 'Horizontal growth pattern', hi: 'Vertical growth pattern' },
  { g: 'Steiner', k: 'OccSN', label: 'Occlusal plane – SN', u: '°', needs: ['S','N','Mo','U1T','L1T'],
    fn: P => lineAng(V(P.S, P.N), occPlane(P)), lo: 'Flat occlusal plane', hi: 'Steep occlusal plane' },
  { g: 'Steiner', k: 'U1NAdeg', label: 'U1 – NA (angle)', u: '°', needs: ['N','A','U1T','U1A'],
    fn: P => lineAng(V(P.N, P.A), V(P.U1A, P.U1T)), lo: 'Retroclined upper incisor', hi: 'Proclined upper incisor' },
  { g: 'Steiner', k: 'U1NAmm', label: 'U1 – NA (mm)', u: 'mm', lin: true, needs: ['N','A','U1L'],
    fn: (P, ant) => perpSigned(P.U1L, P.N, P.A, ant), lo: 'Retruded upper incisor', hi: 'Protruded upper incisor' },
  { g: 'Steiner', k: 'L1NBdeg', label: 'L1 – NB (angle)', u: '°', needs: ['N','B','L1T','L1A'],
    fn: P => lineAng(V(P.N, P.B), V(P.L1A, P.L1T)), lo: 'Retroclined lower incisor', hi: 'Proclined lower incisor' },
  { g: 'Steiner', k: 'L1NBmm', label: 'L1 – NB (mm)', u: 'mm', lin: true, needs: ['N','B','L1L'],
    fn: (P, ant) => perpSigned(P.L1L, P.N, P.B, ant), lo: 'Retruded lower incisor', hi: 'Protruded lower incisor' },
  { g: 'Steiner', k: 'Interincisal', label: 'Interincisal angle', u: '°', needs: ['U1T','U1A','L1T','L1A'],
    fn: P => angBetween(V(P.U1T, P.U1A), V(P.L1T, P.L1A)), lo: 'Proclined incisors', hi: 'Upright incisors' },
  { g: 'Steiner', k: 'U1SN', label: 'U1 – SN', u: '°', needs: ['S','N','U1T','U1A'],
    fn: P => angBetween(V(P.N, P.S), V(P.U1A, P.U1T)), lo: 'Retroclined upper incisor', hi: 'Proclined upper incisor' },
  // Downs
  { g: 'Downs', k: 'Facial', label: 'Facial angle', u: '°', needs: ['Po','Or','N','Pog'],
    fn: P => angBetween(V(P.Or, P.Po), V(P.N, P.Pog)), lo: 'Retrusive chin', hi: 'Prognathic chin' },
  { g: 'Downs', k: 'Convexity', label: 'Angle of convexity', u: '°', needs: ['N','A','Pog'],
    fn: (P, ant) => { const a = 180 - angBetween(V(P.A, P.N), V(P.A, P.Pog));
      return perpSigned(P.A, P.N, P.Pog, ant) >= 0 ? a : -a; }, lo: 'Concave profile', hi: 'Convex profile' },
  { g: 'Downs', k: 'ABplane', label: 'A–B plane angle', u: '°', needs: ['A','B','N','Pog'],
    fn: (P, ant) => { const a = lineAng(V(P.A, P.B), V(P.N, P.Pog));
      return dot(V(P.A, P.B), ant) < 0 ? -a : a; }, lo: 'Class II jaw relation', hi: 'Class III jaw relation' },
  { g: 'Downs', k: 'Yaxis', label: 'Y-axis', u: '°', needs: ['Po','Or','S','Gn'],
    fn: P => angBetween(V(P.Po, P.Or), V(P.S, P.Gn)), lo: 'Horizontal growth', hi: 'Vertical growth' },
  { g: 'Downs', k: 'FHOcc', label: 'Cant of occlusal plane', u: '°', needs: ['Po','Or','Mo','U1T','L1T'],
    fn: P => lineAng(V(P.Po, P.Or), occPlane(P)), lo: 'Flat occlusal plane', hi: 'Steep occlusal plane' },
  { g: 'Downs', k: 'U1APog', label: 'U1 – APog', u: 'mm', lin: true, needs: ['A','Pog','U1T'],
    fn: (P, ant) => perpSigned(P.U1T, P.A, P.Pog, ant), lo: 'Retruded upper incisor', hi: 'Protruded upper incisor' },
  // Tweed
  { g: 'Tweed', k: 'FMA', label: 'FMA', u: '°', needs: ['Po','Or','Go','Me'],
    fn: P => lineAng(V(P.Po, P.Or), V(P.Go, P.Me)), lo: 'Low angle', hi: 'High angle' },
  { g: 'Tweed', k: 'IMPA', label: 'IMPA', u: '°', needs: ['Go','Me','L1T','L1A'],
    fn: P => angBetween(V(P.Me, P.Go), V(P.L1A, P.L1T)), lo: 'Retroclined lower incisor', hi: 'Proclined lower incisor' },
  { g: 'Tweed', k: 'FMIA', label: 'FMIA', u: '°', needs: ['Po','Or','Go','Me','L1T','L1A'],
    fn: P => 180 - lineAng(V(P.Po, P.Or), V(P.Go, P.Me)) - angBetween(V(P.Me, P.Go), V(P.L1A, P.L1T)),
    lo: 'Proclined lower incisor', hi: 'Upright lower incisor' },
  // Wits: A and B projected on the functional occlusal plane (premolar + molar overlap)
  { g: 'Wits', k: 'Wits', label: 'Wits (AO – BO)', u: 'mm', lin: true, needs: ['A','B','Mo','Pm'],
    fn: (P, ant) => { let d = unit(V(P.Mo, P.Pm)); if (dot(d, ant) < 0) d = { x: -d.x, y: -d.y };
      return dot(V(P.Mo, P.A), d) - dot(V(P.Mo, P.B), d); }, lo: 'Class III jaw relation', hi: 'Class II jaw relation' },
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
    return { ...m, key, norm, val, status, note, means: MEANING[m.k] };
  });
}

// Plain-language quick read from the key values. Indicative only.
function quickRead(results) {
  const r = Object.fromEntries(results.map(x => [x.k, x]));
  const out = [];
  const anb = r.ANB && r.ANB.val, wits = r.Wits && r.Wits.status !== 'calib' ? r.Wits.val : null;
  if (anb != null) {
    const cls = r.ANB.status === 'high' ? 'Class II' : r.ANB.status === 'low' ? 'Class III' : 'Class I';
    let agree = '';
    if (wits != null) {
      const wc = r.Wits.status === 'high' ? 'Class II' : r.Wits.status === 'low' ? 'Class III' : 'Class I';
      agree = wc === cls ? ' (Wits agrees)' : ` (Wits says ${wc}, check)`;
    }
    out.push({ t: 'Skeletal', v: cls + agree });
  }
  const vert = (r.FMA && r.FMA.val != null) ? r.FMA : (r.SNGoGn && r.SNGoGn.val != null ? r.SNGoGn : null);
  if (vert) out.push({ t: 'Growth', v: vert.status === 'high' ? 'Vertical' : vert.status === 'low' ? 'Horizontal' : 'Average' });
  if (r.U1SN && r.U1SN.val != null) out.push({ t: 'Upper incisor', v: r.U1SN.status === 'high' ? 'Proclined' : r.U1SN.status === 'low' ? 'Retroclined' : 'Normal tilt' });
  if (r.IMPA && r.IMPA.val != null) out.push({ t: 'Lower incisor', v: r.IMPA.status === 'high' ? 'Proclined' : r.IMPA.status === 'low' ? 'Retroclined' : 'Normal tilt' });
  return out;
}
