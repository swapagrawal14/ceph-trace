# Ceph Trace

Digital cephalometric tracing in the browser, built with p5.js.

Upload a lateral cephalogram, tap the landmarks in a guided order, and get Steiner, Downs, Tweed and Wits analysis instantly, with norms, interpretation, and export.

## Features
- Guided landmark placement (17 points) with definitions for each
- Zoom loupe while placing or dragging, so your finger never hides the point
- Pinch / wheel zoom, two-finger pan, relative drag to refine, undo
- Ruler calibration for linear (mm) values
- Steiner: SNA, SNB, ANB, SN–GoGn, occlusal plane–SN, U1–NA, L1–NB, interincisal, U1–SN
- Downs: facial angle, convexity, A–B plane, Y-axis, cant of occlusal plane, U1–APog
- Tweed triangle: FMA, IMPA, FMIA
- Wits appraisal (female / male norms)
- Editable norms (saved on your device), brightness / contrast / invert
- Export a traced PNG report and CSV
- Runs fully on-device. The radiograph is never uploaded.

## Run
Static site. Open `index.html` through any static server, or deploy to Vercel / GitHub Pages.

## Notes
Educational aid for tracing practice. Landmark placement and every value should be verified clinically. Default norms are commonly quoted Steiner / Downs / Tweed / Jacobson values; population-specific norms can be set in the app.

Built by Swapnil Agrawal (BDS intern).
