// Demo cephalogram: "Cephalometric radiograph" by ANUG, Wikimedia Commons, CC BY-SA 4.0
// https://commons.wikimedia.org/wiki/File:Cephalometric_radiograph.JPG (resized to 1400x1120)
// Landmark positions are an approximate reference tracing for practice. Verify and refine.
const DEMO = {
  src: 'assets/demo-ceph.jpg',
  credit: 'Demo radiograph: ANUG, Wikimedia Commons, CC BY-SA 4.0',
  // ruler on the nasion relator: two long ticks 30 mm apart
  calib: { a: { x: 1262, y: 57 }, b: { x: 1262, y: 216 }, mm: 30 },
  P: {
    S: { x: 803, y: 390 }, N: { x: 1141, y: 399 }, Or: { x: 1083, y: 486 }, Po: { x: 681, y: 514 },
    A: { x: 1136, y: 650 }, B: { x: 1110, y: 862 }, Pog: { x: 1120, y: 925 }, Gn: { x: 1108, y: 955 },
    Me: { x: 1085, y: 968 }, Go: { x: 775, y: 805 },
    U1T: { x: 1165, y: 762 }, U1A: { x: 1125, y: 645 }, U1L: { x: 1163, y: 738 },
    L1T: { x: 1150, y: 755 }, L1A: { x: 1092, y: 858 }, L1L: { x: 1158, y: 775 },
    Pm: { x: 1050, y: 752 }, Mo: { x: 985, y: 749 },
  },
};
