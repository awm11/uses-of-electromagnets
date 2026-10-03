import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const C = {
  ink: "#202020",
  blue: "#2166d1",
  blueLight: "#eaf3ff",
  green: "#2d9b55",
  muted: "#59636f",
  metal: "#8f969d",
  metalDark: "#555c63",
};

// Timing: 3 cycles at 1 Hz (3 s), then 3 cycles at 2 Hz (1.5 s), repeat.
const SLOW_TIME = 3;
const FAST_TIME = 1.5;
const PERIOD = SLOW_TIME + FAST_TIME;
const FLOW_POS = "#dc2626";
const FLOW_NEG = "#2166d1";
const AUDIO_SCALE = 100;
const MASTER_VOLUME = 0.15;
const SLOW_FACTOR = 0.2;
const WINDOW = 3;

// Air particles
const SRC_X = 455;
const WAVE_SPEED = 130;

const tinselPath = (k, cx) => {
  const tx = 404 + cx;
  const bx = 430 + cx;

  return k === 0
    ? "M" +
        tx.toFixed(1) +
        ",326 C" +
        (tx + 16).toFixed(1) +
        ",325 434,316 434,295"
    : "M434,395 C434,384 " +
        (bx + 4).toFixed(1) +
        ",376 " +
        bx.toFixed(1) +
        ",364";
};

const FIELD_LINES = [400, 409, 418, 427].flatMap((x) => [
  "M" + x + ",337 L" + x + ",323",
  "M" + x + ",353 L" + x + ",367",
]);

const COIL_WINDINGS = [406, 410, 414, 418, 422, 426, 430];

const AIR_AMP = 5.5;

const seededRandom = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const COLS = 63;
const AIR_X0 = 490;
const AIR_DX = 10;
const AIR_DY = 14;
const AIR_CY = 345;
const AIR_H0 = 84;
const FAN_TAN = 0.14;
const TRACER_COLS = [4, 16, 28, 40, 52];

const APEX_X = AIR_X0 - AIR_H0 / FAN_TAN;
const R_REF = SRC_X - APEX_X;

const halfHeightAt = (x) => AIR_H0 + (x - AIR_X0) * FAN_TAN;

const rand = seededRandom(7);
const AIR = [];

for (let c = 0; c < COLS; c++) {
  const xr = AIR_X0 + c * AIR_DX;
  const rows = Math.floor(halfHeightAt(xr) / AIR_DY);

  for (let r = -rows; r <= rows; r++) {
    const tracer = r === 0 && TRACER_COLS.includes(c);

    AIR.push({
      x: xr + (tracer ? 0 : (rand() - 0.5) * 9),
      y: AIR_CY + r * AIR_DY + (tracer ? 0 : (rand() - 0.5) * 10),
      r: tracer ? 4.5 : 2.6 + rand() * 0.8,
      frac: c / (COLS - 1),
      tracer,
    });
  }
}

const SHADE = {
  x: 458,
  y: 110,
  w: 670,
  h: 470,
  max: 0.4,
};

const SHADE_R_IN = 560;
const SHADE_R_OUT = 1260;

const smoothstep = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

const SHADE_STOPS = Array.from({ length: 85 }, (_, k) => {
  const off = k / 84;
  const rad =
    SHADE_R_IN + off * (SHADE_R_OUT - SHADE_R_IN);

  return {
    off: rad / SHADE_R_OUT,
    delay: Math.max(0, rad - R_REF) / WAVE_SPEED,
    fade:
      smoothstep((rad - 580) / 100) *
      smoothstep((1235 - rad) / 160) * // gone before the far end, so no cut-off edge
      (1 - 0.9 * off),
  };
});

const fanPoints = (d) => {
  const x0 = SHADE.x;
  const x1 = SHADE.x + SHADE.w;
  const h0 = halfHeightAt(x0) + d;
  const h1 = halfHeightAt(x1) + d;

  return (
    x0 +
    "," +
    (AIR_CY - h0) +
    " " +
    x1 +
    "," +
    (AIR_CY - h1) +
    " " +
    x1 +
    "," +
    (AIR_CY + h1) +
    " " +
    x0 +
    "," +
    (AIR_CY + h0)
  );
};

// Many thin nested outlines add up to a smooth edge (about 70 px wide) with no visible steps
const FAN_MASK_STEPS = Array.from({ length: 25 }, (_, k) => 36 - 3 * k);

AIR.forEach((p) => {
  const dx = p.x - APEX_X;
  const dy = p.y - AIR_CY;
  const rad = Math.hypot(dx, dy);

  p.delay = Math.max(0, rad - R_REF) / WAVE_SPEED;
  p.amp = AIR_AMP * (1 - 0.5 * p.frac);
  p.ax = (p.amp * dx) / rad;
  p.ay = (p.amp * dy) / rad;
  p.xs = p.x;
  p.ys = p.y;
});

const AIR_GROUPS = [
  {
    color: C.metal,
    width: 5.5,
    pts: AIR.filter(
      (p) => !p.tracer && p.r < 2.9
    ),
  },
  {
    color: C.metal,
    width: 6.1,
    pts: AIR.filter(
      (p) =>
        !p.tracer &&
        p.r >= 2.9 &&
        p.r < 3.2
    ),
  },
  {
    color: C.metal,
    width: 6.7,
    pts: AIR.filter(
      (p) => !p.tracer && p.r >= 3.2
    ),
  },
  {
    color: C.blue,
    width: 9,
    pts: AIR.filter((p) => p.tracer),
  },
];

const mod = (a, n) => ((a % n) + n) % n;

const TWO_PI = 2 * Math.PI;
const SEGS = [{ t: -1e9, mode: "changing" }];

const SIGNAL_OPTIONS = [
  { id: "steady", label: "Steady tone" },
  { id: "changing", label: "Changing" },
  { id: "two", label: "Two tones" },
];

const modeAt = (tau) => {
  for (let k = SEGS.length - 1; k > 0; k--) {
    if (SEGS[k].t <= tau) return SEGS[k].mode;
  }

  return SEGS[0].mode;
};

const sigAt = (t) => {
  const m = modeAt(t);

  if (m === "steady") return "1";
  if (m === "two") return "2+3";

  return mod(t, PERIOD) < SLOW_TIME ? "1" : "2";
};

const currentAt = (t) => {
  const m = modeAt(t);

  if (m === "steady") {
    return Math.sin(TWO_PI * t);
  }

  if (m === "two") {
    return (
      0.5 *
      (Math.sin(TWO_PI * 2 * t) +
        Math.sin(TWO_PI * 3 * t))
    );
  }

  const tm = mod(t, PERIOD);

  if (tm < SLOW_TIME) {
    return Math.sin(TWO_PI * tm);
  }

  return Math.sin(
    TWO_PI * 2 * (tm - SLOW_TIME)
  );
};

const pressureAt = (t) => {
  const m = modeAt(t);

  if (m === "steady") {
    return Math.cos(TWO_PI * t);
  }

  if (m === "two") {
    return (
      (2 * Math.cos(TWO_PI * 2 * t) +
        3 * Math.cos(TWO_PI * 3 * t)) /
      5
    );
  }

  const tm = mod(t, PERIOD);

  if (tm < SLOW_TIME) {
    return Math.cos(TWO_PI * tm);
  }

  return Math.cos(
    TWO_PI * 2 * (tm - SLOW_TIME)
  );
};

const PLOT = {
  x: 60,
  y: 20,
  w: 470,
  h: 170,
};

const PL = PLOT.x + 50;
const PR = PLOT.x + PLOT.w - 24;
const PM = PLOT.y + PLOT.h / 2 + 8;
const PA = 56;

// ---------------------------------------------------------------------------
// 3D cutaway speaker (three.js)
// Ring-magnet motor: back plate with centre pole, ring magnet, top plate, basket,
// voice coil on a former, cone, dust cap and surround. A wedge is cut away and the
// wedge turns to face the camera, so the inside is always visible as you orbit.
// Axis of the speaker is the local Y axis; the whole thing is rotated onto world X.
// ---------------------------------------------------------------------------
const CUT_WIDTH = (100 * Math.PI) / 180; // angular width of the cutaway wedge
const PHI0 = CUT_WIDTH / 2;
const PHI_LEN = Math.PI * 2 - CUT_WIDTH;
// The cutaway faces the starting camera and then stays put (see Speaker3D)
const START_SPIN = Math.atan2(-1.9, 6.1);
const CONE_TRAVEL = 0.07; // axial travel of the cone per unit of current (3D units)

const ensureCCW = (pts) => {
  let a = 0;
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k];
    const q = pts[(k + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a < 0 ? pts.slice().reverse() : pts;
};

const rectProfile = (r0, r1, y0, y1) => [
  [r0, y0],
  [r1, y0],
  [r1, y1],
  [r0, y1],
];

// Surface of revolution from a closed (r, y) profile, with flat shading per edge
function latheGeometry(profile, phiStart, phiLength, segments) {
  const pos = [];
  const nor = [];
  const idx = [];

  for (let e = 0; e < profile.length; e++) {
    const a = profile[e];
    const b = profile[(e + 1) % profile.length];
    const dr = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dr, dy);
    if (len < 1e-6) continue;

    const nr = dy / len;
    const ny = -dr / len;
    const base = pos.length / 3;

    for (let s = 0; s <= segments; s++) {
      const phi = phiStart + (phiLength * s) / segments;
      const sn = Math.sin(phi);
      const cs = Math.cos(phi);
      pos.push(a[0] * sn, a[1], a[0] * cs, b[0] * sn, b[1], b[0] * cs);
      nor.push(nr * sn, ny, nr * cs, nr * sn, ny, nr * cs);
    }

    for (let s = 0; s < segments; s++) {
      const i = base + s * 2;
      idx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

const ARC_STEPS = 20;

const SURROUND_PROFILE = (() => {
  const c = [1.45, 1.235];
  const outer = [];
  const inner = [];
  for (let k = 0; k <= ARC_STEPS; k++) {
    const th = Math.PI - (k * Math.PI) / ARC_STEPS;
    outer.push([c[0] + 0.075 * Math.cos(th), c[1] + 0.075 * Math.sin(th)]);
  }
  for (let k = ARC_STEPS; k >= 0; k--) {
    const th = Math.PI - (k * Math.PI) / ARC_STEPS;
    inner.push([c[0] + 0.055 * Math.cos(th), c[1] + 0.055 * Math.sin(th)]);
  }
  return outer.concat(inner);
})();

const DOME_PROFILE = (() => {
  const outer = [];
  const inner = [];
  for (let k = 0; k <= ARC_STEPS; k++) {
    const th = (k * Math.PI) / (2 * ARC_STEPS);
    outer.push([0.36 * Math.cos(th), 0.74 + 0.16 * Math.sin(th)]);
  }
  for (let k = ARC_STEPS; k >= 0; k--) {
    const th = (k * Math.PI) / (2 * ARC_STEPS);
    inner.push([0.345 * Math.cos(th), 0.74 + 0.145 * Math.sin(th)]);
  }
  return outer.concat(inner);
})();

// Voice-coil turns: ten separate rings of round wire sitting on the former, with a
// small gap between neighbouring turns
const TURNS = 10;
const TURN_PITCH = 0.028;
const WIRE_R = 0.011;
const turnProfile = (yc) => {
  const pts = [];
  for (let k = 0; k < 14; k++) {
    const th = (k / 14) * Math.PI * 2;
    pts.push([0.35 + WIRE_R + WIRE_R * Math.cos(th), yc + WIRE_R * Math.sin(th)]);
  }
  return pts;
};

// Soft "studio" environment used for reflections on the metal parts, generated in code
// (a gradient dome plus a few bright softboxes), so no image files are needed.
function buildEnvironment(renderer) {
  const env = new THREE.Scene();

  const dome = new THREE.SphereGeometry(10, 32, 16);
  const pos = dome.attributes.position;
  const lo = new THREE.Color(0x101318);
  const hi = new THREE.Color(0x808995);
  const c = new THREE.Color();
  const cols = [];
  for (let v = 0; v < pos.count; v++) {
    c.copy(lo).lerp(hi, Math.pow((pos.getY(v) / 10 + 1) / 2, 1.5));
    cols.push(c.r, c.g, c.b);
  }
  dome.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  env.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));

  const softbox = (x, y, z, w, h, k) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  softbox(-6, 5, 5, 6, 4, 3); // key
  softbox(7, 2, 3, 4, 6, 1.2); // fill
  softbox(0, 9, -2, 8, 3, 1.6); // overhead
  softbox(-3, -2, -8, 7, 2, 1.4); // rim from behind

  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.03).texture;
  pmrem.dispose();
  env.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  return tex;
}

function buildSpeaker() {
  const root = new THREE.Group();
  root.rotation.z = -Math.PI / 2; // local +Y (the axis) -> world +X
  root.position.x = -0.75;

  const spin = new THREE.Group(); // turned about the axis so the cutaway faces the camera
  const moving = new THREE.Group(); // cone, dust cap, former and coil
  root.add(spin);
  spin.add(moving);

  const geos = [];
  const mats = [];
  const flex = [];

  const part = (parent, profile, color, o = {}) => {
    const pts = ensureCCW(profile);
    const body = new THREE.MeshStandardMaterial({
      color,
      metalness: o.metal ?? 0.3,
      roughness: o.rough ?? 0.55,
      side: THREE.DoubleSide,
    });
    const cut = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).offsetHSL(0, 0, 0.06),
      metalness: 0,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    mats.push(body, cut);

    // o.full: a complete body of revolution that the cutaway never touches
    const p0 = o.full ? 0 : PHI0;
    const pLen = o.full ? Math.PI * 2 : PHI_LEN;
    const meshes = [new THREE.Mesh(latheGeometry(pts, p0, pLen, 120), body)];
    const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));

    // Flat cross-section faces on both edges of the cutaway wedge
    if (!o.full) {
      [PHI0, PHI0 + PHI_LEN].forEach((phi) => {
        const cap = new THREE.Mesh(new THREE.ShapeGeometry(shape), cut);
        cap.rotation.y = phi - Math.PI / 2;
        meshes.push(cap);
      });
    }

    meshes.forEach((m) => {
      m.frustumCulled = false;
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      geos.push(m.geometry);
      if (o.flex) {
        m.geometry.userData.base = m.geometry.attributes.position.array.slice();
        flex.push(m.geometry);
      }
    });
  };

  // --- Magnetic motor (static) ---
  // Back plate (cut away with the rest) and the centre pole (N), which is never cut
  part(spin, rectProfile(0, 0.9, 0, 0.12), "#5d6670", { metal: 0.85, rough: 0.35 });
  part(spin, rectProfile(0, 0.28, 0.11, 0.54), "#5d6670", { metal: 0.85, rough: 0.35, full: true });
  // Ring magnet (plain colour; the poles are identified by the N and S labels)
  part(spin, rectProfile(0.55, 0.9, 0.12, 0.42), "#4b5560", { metal: 0.8, rough: 0.4 });
  // Top plate (S): its hole leaves the annular gap around the centre pole
  part(spin, rectProfile(0.42, 0.9, 0.42, 0.54), "#8a939d", { metal: 0.9, rough: 0.28 });

  // --- Basket and surround (static) ---
  part(spin, [[0.88, 0.5], [0.92, 0.5], [1.52, 1.2], [1.48, 1.2]], "#6b747e", { metal: 0.6, rough: 0.45 });
  part(spin, rectProfile(1.44, 1.66, 1.2, 1.26), "#6b747e", { metal: 0.6, rough: 0.45 });
  part(spin, SURROUND_PROFILE, "#3a4350", { metal: 0, rough: 0.75, flex: true });

  // --- Moving assembly ---
  part(moving, [[0.36, 0.74], [0.4, 0.74], [1.4, 1.22], [1.36, 1.22]], "#d6cfc1", { metal: 0, rough: 0.9 });
  part(moving, DOME_PROFILE, "#bdb5a5", { metal: 0, rough: 0.8 });
  part(moving, rectProfile(0.33, 0.35, 0.3, 0.74), "#c9c2b4", { metal: 0, rough: 0.6 });
  for (let k = 0; k < TURNS; k++) {
    part(moving, turnProfile(0.311 + k * TURN_PITCH), "#b86f32", { metal: 1, rough: 0.28 });
  }

  // --- Pole labels, sitting on the exposed front faces inside the cutaway wedge ---
  // N on the centre pole, S on the outer (top plate) ring. The wedge is centred on
  // local azimuth 0, which is the +Z direction of the spin group.
  const textures = [];
  // Labels are flat discs lying on the surface they label (a hair above it so they don't
  // cut into it). `up` is the in-plane direction of the top of the letter and `n` the
  // surface normal; both are vectors in the spin group's local space.
  const label = (letter, color, at, size, up, n) => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = color;
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = "#ffffff";
    g.stroke();
    g.fillStyle = "#ffffff";
    g.font = "bold 76px Inter, Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(letter, 64, 68);

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const geo = new THREE.PlaneGeometry(size, size);
    const mesh = new THREE.Mesh(geo, mat);
    const nV = new THREE.Vector3(n[0], n[1], n[2]);
    const yV = new THREE.Vector3(up[0], up[1], up[2]);
    const xV = new THREE.Vector3().crossVectors(yV, nV); // so that x × y = normal
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xV, yV, nV));
    mesh.position.set(at[0] + n[0] * 0.004, at[1] + n[1] * 0.004, at[2] + n[2] * 0.004);
    mesh.renderOrder = 3;
    spin.add(mesh);
    geos.push(geo);
    textures.push(tex);
    mats.push(mat);
  };

  // Local-space direction that appears as world "up" once the spin group is turned
  const UP = [-Math.cos(START_SPIN), 0, -Math.sin(START_SPIN)];

  // N lies flat on the centre pole's front (end) face
  label("N", "#c94b3d", [0, 0.54, 0], 0.34, UP, [0, 1, 0]);

  // The whole outer ring (ring magnet + top plate) is the south pole. Its two exposed
  // cross-section faces (either side of the wedge) are tinted and labelled as one region.
  const RING = [[0.55, 0.12], [0.9, 0.12], [0.9, 0.54], [0.42, 0.54], [0.42, 0.42], [0.55, 0.42]];
  const ringGeo = new THREE.ShapeGeometry(new THREE.Shape(RING.map((p) => new THREE.Vector2(p[0], p[1]))));
  const ringMat = new THREE.MeshBasicMaterial({
    color: "#2b6fd6",
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  geos.push(ringGeo);
  mats.push(ringMat);
  [PHI0 - 0.03, -PHI0 + 0.03].forEach((a) => {
    const face = new THREE.Mesh(ringGeo, ringMat);
    face.rotation.y = a - Math.PI / 2; // lay the region on the cut plane, just inside the wedge
    spin.add(face);
    // Flat on the cut face, letter upright: the face's in-plane directions are the
    // axis and the radial direction, and the radial one is what points up or down
    const radial = [Math.sin(a), 0, Math.cos(a)];
    const worldUpSign = -Math.sin(a + START_SPIN) >= 0 ? 1 : -1; // radial -> world Y is -sin(angle)
    const side = a > 0 ? -1 : 1; // normal points into the cutaway wedge
    const n = [side * Math.cos(a), 0, -side * Math.sin(a)];
    label(
      "S",
      "#2b6fd6",
      [0.72 * radial[0], 0.33, 0.72 * radial[2]],
      0.3,
      [worldUpSign * radial[0], 0, worldUpSign * radial[2]],
      n
    );
  });

  // --- Magnetic field lines (shown with the "Magnetic field lines" toggle) ---
  // Radial lines along the whole length of the N centre pole, each running out to the
  // S outer ring (the top plate's bore near the front, the ring magnet's bore behind it),
  // with a small arrowhead half way along. They sit inside the cutaway wedge.
  const field = new THREE.Group();
  const fieldMat = new THREE.MeshBasicMaterial({
    color: "#2d9b55",
    transparent: true,
    opacity: 0,
    toneMapped: false,
    depthWrite: false, // depth-tested as normal, so solid parts hide the lines behind them
  });
  const lineGeo = new THREE.CylinderGeometry(0.004, 0.004, 1, 6); // unit length, scaled per line
  const headGeo = new THREE.ConeGeometry(0.014, 0.035, 10);
  geos.push(lineGeo, headGeo);
  mats.push(fieldMat);

  const POLE_R = 0.285; // just outside the centre pole (r = 0.28)
  const heights = [];
  for (let y = 0.14; y <= 0.53; y += 0.035) heights.push(y);

  // All the way round the axis, drawn as two instanced meshes (lines and arrowheads).
  // Drawn with normal depth testing: they are only visible where the gap is exposed.
  const AZ_COUNT = 24;
  const count = AZ_COUNT * heights.length;
  const lines = new THREE.InstancedMesh(lineGeo, fieldMat, count);
  const heads = new THREE.InstancedMesh(headGeo, fieldMat, count);
  const dummy = new THREE.Object3D();
  dummy.rotation.order = "YXZ";

  let n = 0;
  for (let a = 0; a < AZ_COUNT; a++) {
    const az = (a / AZ_COUNT) * Math.PI * 2;
    heights.forEach((y) => {
      const outerR = (y > 0.42 ? 0.42 : 0.55) - 0.005; // bore of the S ring at this height
      const len = outerR - POLE_R;
      const mid = POLE_R + len / 2; // arrowhead half way along
      // cylinder/cone axis (Y) -> radial direction at azimuth az
      dummy.rotation.set(Math.PI / 2, az, 0);
      dummy.position.set(mid * Math.sin(az), y, mid * Math.cos(az));
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      lines.setMatrixAt(n, dummy.matrix);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      heads.setMatrixAt(n, dummy.matrix); // cone tip points outward (N to S)
      n++;
    });
  }
  [lines, heads].forEach((m) => {
    m.frustumCulled = false;
    field.add(m);
  });
  field.visible = false;
  spin.add(field);

  const setField = (on) => {
    fieldMat.opacity += ((on ? 0.8 : 0) - fieldMat.opacity) * 0.15;
    field.visible = fieldMat.opacity > 0.02;
  };

  // Surround flexes: its inner edge follows the cone, its outer edge stays on the basket
  const flexTo = (d) => {
    flex.forEach((g) => {
      const pos = g.attributes.position;
      const base = g.userData.base;
      for (let v = 0; v < pos.count; v++) {
        const r = Math.hypot(base[3 * v], base[3 * v + 2]);
        const w = Math.min(1, Math.max(0, (1.53 - r) / 0.15));
        pos.setY(v, base[3 * v + 1] + d * w);
      }
      pos.needsUpdate = true;
    });
  };

  const dispose = () => {
    field.children.forEach((c) => c.dispose && c.dispose());
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  };

  return { root, spin, moving, flexTo, setField, dispose };
}

function Speaker3D({ signalRef, showField, active = true }) {
  const mountRef = useRef(null);
  const activeRef = useRef(true);
  activeRef.current = active;
  const showRef = useRef(false);
  showRef.current = showField;

  useEffect(() => {
    const el = mountRef.current;
    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      return undefined; // no WebGL: leave the window empty
    }

    const basePixelRatio = Math.min(3, Math.max(2, (window.devicePixelRatio || 1) * 1.5));
    renderer.setClearColor(0x000000, 0);
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildEnvironment(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(2.6, 1.9, 6.1);

    // Lights ride on the camera, so the speaker stays well lit from every angle
    scene.add(camera);
    camera.add(new THREE.HemisphereLight(0xffffff, 0x5b6573, 0.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-3, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: 0.5, far: 30 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3;
    camera.add(key);
    const fill = new THREE.DirectionalLight(0xbfd2ff, 0.3);
    fill.position.set(4, -1, 2);
    camera.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.7);
    rim.position.set(2, 3, -4);
    camera.add(rim);

    // Minimal drag-to-orbit (no extra imports): azimuth and elevation around the origin
    const view = {
      az: Math.atan2(2.6, 6.1),
      el: Math.atan2(1.9, Math.hypot(2.6, 6.1)),
      dist: Math.hypot(2.6, 1.9, 6.1),
      vAz: 0,
      vEl: 0,
      lastAz: 0,
      lastEl: 0,
    };
    const place = () => {
      const c = Math.cos(view.el);
      camera.position.set(
        view.dist * c * Math.sin(view.az),
        view.dist * Math.sin(view.el),
        view.dist * c * Math.cos(view.az)
      );
      camera.lookAt(0, 0, 0);
    };
    place();

    const canvas = renderer.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      view.vAz -= (e.clientX - lastX) * 0.008;
      view.vEl += (e.clientY - lastY) * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
      view.vAz = view.lastAz; // glide on from the last drag speed
      view.vEl = view.lastEl;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const speaker = buildSpeaker();
    scene.add(speaker.root);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      // supersample, but keep the total pixel count reasonable (e.g. when maximised)
      renderer.setPixelRatio(Math.min(basePixelRatio, Math.sqrt(9e6 / (w * h))));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // The cutaway wedge faces the starting camera position and then stays fixed in
    // space while you orbit (it does not follow the camera)
    speaker.spin.rotation.y = START_SPIN;

    let raf;
    const loop = () => {
      if (!activeRef.current) {
        raf = requestAnimationFrame(loop); // hidden: skip all the work
        return;
      }
      if (view.vAz || view.vEl) {
        view.az += view.vAz;
        view.el = Math.max(-1.3, Math.min(1.3, view.el + view.vEl));
        if (dragging) {
          // follow the pointer exactly, remembering the speed for the glide
          view.lastAz = view.vAz;
          view.lastEl = view.vEl;
          view.vAz = 0;
          view.vEl = 0;
        } else {
          // after release, glide to rest
          view.vAz = Math.abs(view.vAz) < 1e-4 ? 0 : view.vAz * 0.9;
          view.vEl = Math.abs(view.vEl) < 1e-4 ? 0 : view.vEl * 0.9;
        }
        place();
      }

      // Cone, coil and surround follow the live current
      const d = (signalRef.current || 0) * CONE_TRAVEL;
      speaker.moving.position.y = d;
      speaker.flexTo(d);
      speaker.setField(showRef.current);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      speaker.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [signalRef]);

  return <div ref={mountRef} className="speaker3d" />;
}

export default function ACCircuit({ onBack, disableSound = false, disable3D = false }) {
  const [sig, setSig] = useState("2");
  const [mode, setMode] = useState("changing");
  const [muted, setMuted] = useState(true);

  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const audioRef = useRef({});
  const modeRef = useRef("changing");
  modeRef.current = mode;

  const [slow, setSlow] = useState(false);
  const [showField, setShowField] =
    useState(false);

  const slowRef = useRef(false);
  slowRef.current = slow;

  const traceRef = useRef(null);
  const dotRef = useRef(null);
  const flowRefs = useRef([]);
  const coneRef = useRef(null);
  const suspRefs = useRef([]);
  const tinselRefs = useRef([]);
  const airRefs = useRef([]);
  const stopRefs = useRef([]);
  const dirRef = useRef(null);
  const readoutRef = useRef(null);
  const signalRef = useRef(0); // live current, shared with the 3D view
  const [maximised, setMaximised] = useState(false);
  const [minimised, setMinimised] = useState(false);

  useEffect(() => {
    if (!maximised) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMaximised(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maximised]);

  useEffect(() => {
      if (disableSound) return;
    const start = () => {
      const a = audioRef.current;

      if (a.ctx) {
        if (a.ctx.state === "suspended") {
          a.ctx.resume();
        }
        return;
      }

      const AC =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AC) return;

      const ctx = new AC();
      const master = ctx.createGain();

      master.gain.value = mutedRef.current
        ? 0
        : MASTER_VOLUME;

      master.connect(ctx.destination);

      const tone = (freq) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freq;

        const g = ctx.createGain();
        g.gain.value = 0;

        o.connect(g);
        g.connect(master);
        o.start();

        return { o, g };
      };

      const A = tone(1 * AUDIO_SCALE);
      const B = tone(3 * AUDIO_SCALE);

      Object.assign(a, {
        ctx,
        master,
        oscA: A.o,
        gA: A.g,
        gB: B.g,
        appliedSig: null,
      });

    };

    window.addEventListener(
      "pointerdown",
      start
    );

    window.addEventListener(
      "keydown",
      start
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        start
      );

      window.removeEventListener(
        "keydown",
        start
      );

      const a = audioRef.current;

      if (a.ctx) a.ctx.close();

      audioRef.current = {};
    };
  }, [disableSound]);

  useEffect(() => {
    const a = audioRef.current;

    if (a.ctx) {
      a.master.gain.setTargetAtTime(
        muted ? 0 : MASTER_VOLUME,
        a.ctx.currentTime,
        0.03
      );
    }
  }, [muted]);

  useEffect(() => {
    let raf;
    let last = performance.now();

    SEGS.length = 0;
    SEGS.push({
      t: -1e9,
      mode: modeRef.current,
    });

    let pendingT = null;
    let simT = 0;
    let speed = 1;
    let offset = 0;
    let lastDir = "";

    const N = 160;

    const loop = (now) => {
      const real = Math.min(
        (now - last) / 1000,
        0.1
      );

      last = now;

      speed +=
        ((slowRef.current
          ? SLOW_FACTOR
          : 1) -
          speed) *
        Math.min(1, real * 6);

      simT += real * speed;

      const t = simT;
      const dt = real * speed;

      if (
        pendingT === null &&
        modeRef.current !==
          SEGS[SEGS.length - 1].mode
      ) {
        pendingT =
          Math.ceil(t / 0.5) * 0.5;
      }

      if (
        pendingT !== null &&
        t >= pendingT
      ) {
        if (
          modeRef.current !==
          SEGS[SEGS.length - 1].mode
        ) {
          SEGS.push({
            t: pendingT,
            mode: modeRef.current,
          });
        }

        pendingT = null;
      }

      while (
        SEGS.length > 1 &&
        SEGS[1].t < t - 8
      ) {
        SEGS.shift();
      }

      const i = currentAt(t);
      signalRef.current = i;

      const pts = new Array(N + 1);

      for (let k = 0; k <= N; k++) {
        const x =
          PL +
          (k / N) * (PR - PL);

        const y =
          PM -
          currentAt(
            t -
              WINDOW +
              (k / N) * WINDOW
          ) *
            PA;

        pts[k] =
          x.toFixed(1) +
          "," +
          y.toFixed(1);
      }

      traceRef.current.setAttribute(
        "points",
        pts.join(" ")
      );

      dotRef.current.setAttribute(
        "cy",
        (PM - i * PA).toFixed(1)
      );

      offset -= i * dt * 90;

      const op = (
        0.2 +
        0.8 * Math.abs(i)
      ).toFixed(2);

      const flowColor =
        i >= 0
          ? FLOW_POS
          : FLOW_NEG;

      flowRefs.current.forEach(
        (el) => {
          el.setAttribute(
            "stroke",
            flowColor
          );

          el.setAttribute(
            "stroke-dashoffset",
            offset.toFixed(1)
          );

          el.setAttribute(
            "stroke-opacity",
            op
          );
        }
      );

      const cx = i * 7;

      coneRef.current.setAttribute(
        "transform",
        "translate(" +
          cx.toFixed(2) +
          " 0)"
      );

      const rim = (
        456 + cx
      ).toFixed(1);

      const bow = (
        468 +
        cx * 0.4
      ).toFixed(1);

      for (let k = 0; k < 2; k++) {
        const d = tinselPath(k, cx);

        for (let j = 0; j < 3; j++) {
          tinselRefs.current[
            k * 3 + j
          ].setAttribute("d", d);
        }
      }

      suspRefs.current[0].setAttribute(
        "d",
        "M" +
          rim +
          ",283 Q" +
          bow +
          ",273 459,266"
      );

      suspRefs.current[1].setAttribute(
        "d",
        "M" +
          rim +
          ",407 Q" +
          bow +
          ",417 459,424"
      );

      AIR_GROUPS.forEach((g, k) => {
        let d = "";

        for (
          let n = 0;
          n < g.pts.length;
          n++
        ) {
          const p = g.pts[n];

          const c = currentAt(
            t - p.delay
          );

          d +=
            "M" +
            (
              p.x +
              p.ax * c
            ).toFixed(1) +
            " " +
            (
              p.y +
              p.ay * c
            ).toFixed(1) +
            "h0";
        }

        airRefs.current[k].setAttribute(
          "d",
          d
        );
      });

      for (
        let k = 0;
        k < SHADE_STOPS.length;
        k++
      ) {
        const st =
          SHADE_STOPS[k];

        const op =
          SHADE.max *
          (0.5 +
            0.5 *
              pressureAt(
                t - st.delay
              )) *
          st.fade;

        stopRefs.current[
          k
        ].setAttribute(
          "stop-opacity",
          op.toFixed(3)
        );
      }

      const dir =
        i >= 0
          ? "Current flows one way"
          : "Current flows the other way";

      if (dir !== lastDir) {
        dirRef.current.textContent =
          dir;

        lastDir = dir;
      }

      readoutRef.current.textContent =
        "= " +
        (i >= 0 ? "+" : "–") +
        Math.abs(i).toFixed(2) +
        " A";

      const sNow = sigAt(t);

      setSig(sNow);

      const au = audioRef.current;

      if (
        au.ctx &&
        au.appliedSig !== sNow
      ) {
        const now =
          au.ctx.currentTime;

        au.oscA.frequency.setTargetAtTime(
          (sNow === "1"
            ? 1
            : 2) * AUDIO_SCALE,
          now,
          0.01
        );

        au.gA.gain.setTargetAtTime(
          sNow === "2+3"
            ? 0.5
            : 1,
          now,
          0.01
        );

        au.gB.gain.setTargetAtTime(
          sNow === "2+3"
            ? 0.5
            : 0,
          now,
          0.01
        );

        au.appliedSig = sNow;
      }

      raf =
        requestAnimationFrame(loop);
    };

    raf =
      requestAnimationFrame(loop);

    return () =>
      cancelAnimationFrame(raf);
  }, []);

  const muteIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3,9 H7 L12,4.5 V19.5 L7,15 H3 Z" fill="currentColor" />
      {muted ? (
        <path
          d="M16,9 L22,15 M22,9 L16,15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.5,8.5 Q18,12 15.5,15.5 M18.5,6 Q23,12 18.5,18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );

  const sigLabel =
    sig === "2+3"
      ? "2 + 3 Hz"
      : sig + " Hz";

  const sigClass =
    sig === "1"
      ? "offText"
      : "onText";

  return (
    <main className="page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0 !important;
          width: 100%;
          min-height: 100%;
          background: #f3f5f7 !important;
        }

        body {
          overflow-x: hidden;
        }

        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f3f5f7;
          color: #202020;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .shell {
          max-width: 1160px;
          margin: 0 auto;
        }

        .heading {
          margin-bottom: 18px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #3867a8;
          margin-bottom: 4px;
        }

        .heading h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.1;
          letter-spacing: -.04em;
        }

        .intro {
          max-width: 780px;
          margin: 8px 0 0;
          color: ${C.muted};
          line-height: 1.5;
          font-size: 14px;
        }

        .card {
          background: #fff;
          border: 1px solid #d9dee4;
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(31, 41, 55, .07);
          overflow: hidden;
        }

        .backRow {
          padding: 14px 18px 0;
        }

        .backButton {
          border: 0;
          background: transparent;
          color: ${C.muted};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
        }

        .stage {
          padding: 12px;
        }

        .stage svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .controls {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          padding: 14px 18px;
          border-top: 1px solid #e2e6ea;
          background: #fafbfc;
        }

        .stageInner {
          position: relative;
        }

        .viewer3d {
          transition: transform 0.35s ease, opacity 0.25s ease;
          position: absolute;
          border: 1px solid #d9dee4;
          border-radius: 12px;
          background: #f7f8fa;
          overflow: hidden;
        }

        .viewer3d.max {
          position: fixed;
          inset: 14px;
          width: auto;
          height: auto;
          z-index: 1000;
          border-radius: 14px;
          box-shadow: 0 0 0 100vmax rgba(15, 23, 42, 0.5);
        }

        .viewer3d.min {
          transform: translateY(-130%);
          opacity: 0;
          pointer-events: none;
        }

        .viewerBtn.viewerBtnMin {
          right: 44px;
        }

        .viewerReopen {
          position: absolute;
          top: 1.2%;
          right: 0.9%;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #c6ccd3;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.95);
          color: ${C.ink};
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .viewerReopen:hover {
          border-color: ${C.blue};
          color: ${C.blue};
        }

        .viewerBtn {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          padding: 0;
          border: 1px solid #c6ccd3;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          color: ${C.ink};
          cursor: pointer;
        }

        .viewerBtn:hover {
          background: #fff;
          border-color: ${C.blue};
          color: ${C.blue};
        }

        .speaker3d {
          width: 100%;
          height: 100%;
          cursor: grab;
        }

        .speaker3d:active {
          cursor: grabbing;
        }

        .viewerToolbar {
          position: absolute;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px 22px;
          padding: 8px 18px;
          border: 1px solid #d9dee4;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 4px 14px rgba(31, 41, 55, 0.12);
        }

        .viewerLabel {
          position: absolute;
          left: 10px;
          bottom: 7px;
          color: ${C.muted};
          font-size: 12px;
          pointer-events: none;
        }

        .readoutI {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-style: italic;
          font-weight: 700;
        }

        .readout {
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          display: inline-block;
          width: 9.5ch;
          flex: 0 0 auto;
          white-space: nowrap;
        }

        .signalBar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 18px;
          border-top: 1px solid #e2e6ea;
        }

        .signalLabel {
          margin-right: 6px;
          color: ${C.muted};
          font-size: 14px;
          font-weight: 700;
        }

        .seg {
          border: 1px solid #c6ccd3;
          background: #fff;
          color: ${C.ink};
          border-radius: 99px;
          padding: 7px 16px;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .seg.on {
          background: ${C.blueLight};
          border-color: ${C.blue};
          color: ${C.blue};
        }

        .soundGroup {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
        }

        .muteBtn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .muteBtn.muted {
          background: #fdecec;
          border-color: #dc2626;
          color: #b91c1c;
        }

        .toggles {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 22px;
        }

        .switchBtn {
          display: flex;
          align-items: center;
          gap: 11px;
          border: 0;
          background: transparent;
          color: ${C.ink};
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          padding: 4px 0;
        }

        .toggle {
          width: 54px;
          height: 30px;
          border-radius: 99px;
          padding: 3px;
          background: #c6ccd3;
          transition: .25s ease;
        }

        .toggle.on {
          background: ${C.blue};
        }

        .toggle.green.on {
          background: #2d9b55;
        }

        .knob {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, .25);
          transition: .25s ease;
        }

        .toggle.on .knob {
          transform: translateX(24px);
        }

        .controls .status {
          justify-self: end;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 250px;
          max-width: 100%;
          flex: 0 0 auto;
          color: ${C.muted};
          font-size: 14px;
          justify-content: flex-end;
          text-align: right;
          white-space: nowrap;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #a7afb8;
          flex: 0 0 auto;
        }

        .dot.on {
          background: #2d9b55;
          box-shadow: 0 0 0 4px #dff3e6;
        }

        .lesson {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 14px;
        }

        .lessonBox {
          background: #fff;
          border: 1px solid #dfe4e8;
          border-radius: 14px;
          padding: 16px 18px;
        }

        .lessonBox h2 {
          margin: 0 0 7px;
          font-size: 15px;
        }

        .lessonBox p {
          margin: 0;
          color: ${C.muted};
          line-height: 1.5;
          font-size: 14px;
        }

        .onText {
          color: #19743b;
          font-weight: 800;
        }

        .offText {
          color: #9b5d13;
          font-weight: 800;
        }

        @media (max-width: 760px) {
          .page {
            padding: 10px;
          }

          .controls {
            display: flex;
            align-items: flex-start;
            flex-direction: column;
          }

          .status {
            text-align: left;
          }

          .lesson {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="shell">
        <header className="heading">
          <div className="eyebrow">
            Electromagnetism • 02
          </div>

          <h1>
            Alternating Current and Sound
          </h1>

          <p className="intro">
            An AC source pushes current back
            and forth around the circuit. The
            speaker cone follows the current and
            sends a pressure wave through the
            air.
          </p>
        </header>

        <section className="card">
          {onBack && (
            <div className="backRow">
              <button
                className="backButton"
                onClick={onBack}
              >
                ← Back
              </button>
            </div>
          )}

          <div className="stage">
            <div className="stageInner">
            <svg
              viewBox={disable3D ? "0 0 1150 550" : "0 -50 1150 600"}
              role="img"
              aria-label="Alternating current circuit with a live current plot, a speaker and air particles"
            >
              <rect
                x={PLOT.x}
                y={PLOT.y}
                width={PLOT.w}
                height={PLOT.h}
                rx="10"
                fill="#fafbfc"
                stroke="#d9dee4"
                strokeWidth="1.5"
              />

              <text
                x={PLOT.x + 16}
                y={PLOT.y + 26}
                fontSize="16"
                fill={C.ink}
                fontWeight="600"
              >
                Current
              </text>

              <text
                x={PLOT.x + PLOT.w - 16}
                y={PLOT.y + 26}
                fontSize="16"
                fill={
                  sig === "1"
                    ? "#19743b"
                    : "#9b5d13"
                }
                fontWeight="700"
                textAnchor="end"
              >
                {sigLabel}
              </text>

              <line
                x1={PL}
                y1={PM}
                x2={PR}
                y2={PM}
                stroke="#a7afb8"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              <line
                x1={PL}
                y1={PM - PA - 8}
                x2={PL}
                y2={PM + PA + 8}
                stroke="#a7afb8"
                strokeWidth="1.5"
              />

              <text
                x={PL - 10}
                y={PM - PA + 5}
                fontSize="13"
                fill={C.muted}
                textAnchor="end"
              >
                +
              </text>

              <text
                x={PL - 10}
                y={PM + 5}
                fontSize="13"
                fill={C.muted}
                textAnchor="end"
              >
                0
              </text>

              <text
                x={PL - 10}
                y={PM + PA + 5}
                fontSize="13"
                fill={C.muted}
                textAnchor="end"
              >
                –
              </text>

              <text
                x={(PL + PR) / 2}
                y={PLOT.y + PLOT.h - 8}
                fontSize="13"
                fill={C.muted}
                textAnchor="middle"
              >
                Last {WINDOW} seconds
              </text>

              <polyline
                ref={traceRef}
                fill="none"
                stroke={C.blue}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <circle
                ref={dotRef}
                cx={PR}
                cy={PM}
                r="6"
                fill={C.blue}
                stroke="#fff"
                strokeWidth="2"
              />

              <polygon
                points="430,292 459,262 459,270 430,300"
                fill={C.metal}
                stroke={C.metalDark}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              <polygon
                points="430,398 459,428 459,420 430,390"
                fill={C.metal}
                stroke={C.metalDark}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              <g
                fill="url(#speakerBody)"
                stroke={C.metalDark}
                strokeWidth="2"
                strokeLinejoin="round"
              >
                <rect
                  x="372"
                  y="300"
                  width="22"
                  height="90"
                  rx="3"
                />

                <rect
                  x="394"
                  y="300"
                  width="36"
                  height="22"
                />

                <rect
                  x="394"
                  y="368"
                  width="36"
                  height="22"
                />

                <rect
                  x="394"
                  y="337"
                  width="36"
                  height="16"
                />
              </g>

              <g
                fontSize="13"
                fontWeight="700"
                fill="#1f2937"
                textAnchor="middle"
              >
                <text x="412" y="316">
                  S
                </text>

                <text x="412" y="384">
                  S
                </text>
              </g>

              <path
                d="M130,377 V440 H372 V395 H434"
                fill="none"
                stroke={C.ink}
                strokeWidth="6"
              />

              <path
                d="M434,295 H372 V250 H130 V313"
                fill="none"
                stroke={C.ink}
                strokeWidth="6"
              />

              <path
                d="M130,377 V440 H372 V395 H434"
                fill="none"
                stroke="#dc2626"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="9 15"
                ref={(el) =>
                  (flowRefs.current[0] = el)
                }
              />

              <path
                d="M434,295 H372 V250 H130 V313"
                fill="none"
                stroke="#dc2626"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="9 15"
                ref={(el) =>
                  (flowRefs.current[1] = el)
                }
              />

              <circle
                cx="130"
                cy="345"
                r="32"
                fill="#fff"
                stroke={C.ink}
                strokeWidth="4"
              />

              <path
                d="M112,345 q9,-20 18,0 t18,0"
                fill="none"
                stroke={C.ink}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              <text
                x="54"
                y="341"
                fontSize="18"
                fill={C.ink}
                textAnchor="middle"
              >
                <tspan x="54">AC</tspan>
                <tspan x="54" dy="21">
                  source
                </tspan>
              </text>

              <defs>
                <linearGradient
                  id="speakerBody"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#6b7280"
                  />
                  <stop
                    offset="45%"
                    stopColor="#d1d5db"
                  />
                  <stop
                    offset="100%"
                    stopColor="#4b5563"
                  />
                </linearGradient>
              </defs>

              <circle
                cx="372"
                cy="295"
                r="4"
                fill={C.ink}
              />

              <circle
                cx="372"
                cy="395"
                r="4"
                fill={C.ink}
              />

              <g ref={coneRef}>
                <polygon
                  points="430,334 456,286 456,404 430,356"
                  fill="#e5e7eb"
                  fillOpacity="0.6"
                />

                <path
                  d="M428,331 L456,284"
                  stroke={C.metalDark}
                  strokeWidth="6"
                  fill="none"
                />

                <path
                  d="M428,331 L456,284"
                  stroke="#d1d5db"
                  strokeWidth="3.5"
                  fill="none"
                />

                <path
                  d="M428,359 L456,406"
                  stroke={C.metalDark}
                  strokeWidth="6"
                  fill="none"
                />

                <path
                  d="M428,359 L456,406"
                  stroke="#d1d5db"
                  strokeWidth="3.5"
                  fill="none"
                />

                <path
                  d="M432,334 Q446,345 432,356 Z"
                  fill="#d1d5db"
                  stroke={C.metalDark}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                <rect
                  x="402"
                  y="326"
                  width="30"
                  height="10"
                  fill="#e5e7eb"
                  stroke={C.metalDark}
                  strokeWidth="1.5"
                />

                <rect
                  x="402"
                  y="354"
                  width="30"
                  height="10"
                  fill="#e5e7eb"
                  stroke={C.metalDark}
                  strokeWidth="1.5"
                />

                <circle
                  cx="404"
                  cy="326"
                  r="3"
                  fill={C.ink}
                />

                <circle
                  cx="430"
                  cy="364"
                  r="3"
                  fill={C.ink}
                />

                <rect
                  x="402"
                  y="336"
                  width="30"
                  height="18"
                  fill="#e5e7eb"
                  fillOpacity="0.35"
                />

                {COIL_WINDINGS.map((x) => (
                  <line
                    key={x}
                    x1={x - 2}
                    y1="327.5"
                    x2={x + 2}
                    y2="362.5"
                    stroke="#c0392b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                ))}
              </g>

              <text
                x="412"
                y="349"
                fontSize="12"
                fontWeight="700"
                fill="#1f2937"
                textAnchor="middle"
                stroke="#d1d5db"
                strokeWidth="3"
                paintOrder="stroke"
              >
                N
              </text>

              <g
                fill="none"
                stroke="#2d9b55"
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                  opacity: showField ? 0.9 : 0,
                  transition:
                    "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
              >
                <defs>
                  <marker
                    id="acFieldArrow"
                    markerUnits="userSpaceOnUse"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path
                      d="M0,0.5 L7,4 L0,7.5 Z"
                      fill="#2d9b55"
                      stroke="none"
                    />
                  </marker>
                </defs>

                {FIELD_LINES.map(
                  (d, k) => (
                    <path
                      key={k}
                      d={d}
                      markerEnd="url(#acFieldArrow)"
                    />
                  )
                )}
              </g>

              {[0, 1].map((k) => (
                <g key={k}>
                  <path
                    ref={(el) =>
                      (tinselRefs.current[
                        k * 3
                      ] = el)
                    }
                    d={tinselPath(k, 0)}
                    fill="none"
                    stroke={C.ink}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  <path
                    ref={(el) =>
                      (tinselRefs.current[
                        k * 3 + 1
                      ] = el)
                    }
                    d={tinselPath(k, 0)}
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="3"
                    strokeDasharray="1.5 2.5"
                  />

                  <path
                    ref={(el) => {
                      tinselRefs.current[
                        k * 3 + 2
                      ] = el;

                      flowRefs.current[
                        2 + k
                      ] = el;
                    }}
                    d={tinselPath(k, 0)}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray="9 15"
                  />
                </g>
              ))}

              <circle
                cx="434"
                cy="295"
                r="4"
                fill={C.ink}
              />

              <circle
                cx="434"
                cy="395"
                r="4"
                fill={C.ink}
              />

              <path
                ref={(el) =>
                  (suspRefs.current[0] = el)
                }
                d="M456,283 Q468,273 459,266"
                fill="none"
                stroke={C.metalDark}
                strokeWidth="3"
                strokeLinecap="round"
              />

              <path
                ref={(el) =>
                  (suspRefs.current[1] = el)
                }
                d="M456,407 Q468,417 459,424"
                fill="none"
                stroke={C.metalDark}
                strokeWidth="3"
                strokeLinecap="round"
              />

              <defs>
                <radialGradient
                  id="acPressureGradient"
                  gradientUnits="userSpaceOnUse"
                  cx={APEX_X}
                  cy={AIR_CY}
                  r={SHADE_R_OUT}
                >
                  {SHADE_STOPS.map(
                    (st, k) => (
                      <stop
                        key={k}
                        ref={(el) =>
                          (stopRefs.current[
                            k
                          ] = el)
                        }
                        offset={st.off}
                        stopColor="#2b3a4d"
                        stopOpacity="0"
                      />
                    )
                  )}
                </radialGradient>

                <mask
                  id="acPressureMask"
                  maskUnits="userSpaceOnUse"
                  x={SHADE.x}
                  y={SHADE.y}
                  width={SHADE.w}
                  height={SHADE.h}
                >
                  {FAN_MASK_STEPS.map(
                    (d) => (
                      <polygon
                        key={d}
                        points={fanPoints(d)}
                        fill="#fff"
                        fillOpacity="0.12"
                      />
                    )
                  )}
                </mask>
              </defs>

              <rect
                x={SHADE.x}
                y={SHADE.y}
                width={SHADE.w}
                height={SHADE.h}
                fill="url(#acPressureGradient)"
                mask="url(#acPressureMask)"
              />

              {AIR.filter(
                (p) => p.tracer
              ).map((p) => (
                <line
                  key={"tick" + p.x}
                  x1={p.x}
                  y1={p.y - 12}
                  x2={p.x}
                  y2={p.y + 12}
                  stroke="#a7afb8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              ))}

              {AIR_GROUPS.map(
                (g, k) => (
                  <path
                    key={k}
                    ref={(el) =>
                      (airRefs.current[
                        k
                      ] = el)
                    }
                    fill="none"
                    stroke={g.color}
                    strokeWidth={g.width}
                    strokeLinecap="round"
                  />
                )
              )}

              <text
                x="560"
                y="488"
                fontSize="18"
                fill={C.ink}
                textAnchor="middle"
              >
                Air particles
              </text>

              <text
                x="415"
                y="458"
                fontSize="18"
                fill={C.ink}
                textAnchor="middle"
              >
                Speaker
              </text>

              <text
                ref={dirRef}
                x="265"
                y="232"
                fontSize="16"
                fill={C.muted}
                textAnchor="middle"
              >
                Current flows one way
              </text>
            </svg>
              {!disable3D && (
                <div
                  className={"viewer3d" + (maximised ? " max" : "") + (minimised ? " min" : "")}
                  style={
                    maximised
                      ? undefined
                      : {
                          left: "60.87%",
                          top: "1.67%",
                          width: "38.26%",
                          height: "33%",
                        }
                  }
                >
                  <Speaker3D signalRef={signalRef} showField={showField} active={!minimised} />
                  <span className="viewerLabel">
                    3D cutaway • drag to rotate
                  </span>

                  {maximised && (
                    <div className="viewerToolbar">
                      <button
                        className="switchBtn"
                        onClick={() => setSlow((v) => !v)}
                        aria-pressed={slow}
                      >
                        <span className={"toggle " + (slow ? "on" : "")}>
                          <span className="knob" />
                        </span>
                        Slow motion
                      </button>

                      <button
                        className="switchBtn"
                        onClick={() => setShowField((v) => !v)}
                        aria-pressed={showField}
                      >
                        <span className={"toggle green " + (showField ? "on" : "")}>
                          <span className="knob" />
                        </span>
                        Magnetic field lines
                      </button>

                      <button
                        className={"seg muteBtn " + (muted ? "muted" : "")}
                        onClick={() => setMuted((v) => !v)}
                        aria-pressed={muted}
                      >
                        {muteIcon}
                        {muted ? "Unmute" : "Mute"}
                      </button>
                    </div>
                  )}

                  {!maximised && (
                    <button
                      className="viewerBtn viewerBtnMin"
                      onClick={() => setMinimised(true)}
                      aria-label="Minimise 3D window"
                      title="Minimise"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M5,15 L12,8 L19,15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}

                  <button
                    className="viewerBtn"
                    onClick={() => setMaximised((v) => !v)}
                    aria-label={maximised ? "Restore 3D window" : "Maximise 3D window"}
                    title={maximised ? "Restore (Esc)" : "Maximise"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d={
                          maximised
                            ? "M9,4 V9 H4 M20,9 H15 V4 M15,20 V15 H20 M4,15 H9 V20"
                            : "M4,9 V4 H9 M15,4 H20 V9 M20,15 V20 H15 M9,20 H4 V15"
                        }
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {!disable3D && minimised && (
                <button
                  className="viewerReopen"
                  onClick={() => setMinimised(false)}
                  aria-label="Show 3D window"
                >
                  3D view
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5,9 L12,16 L19,9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="signalBar">
            <span className="signalLabel">
              Signal
            </span>

            {SIGNAL_OPTIONS.map((o) => (
              <button
                key={o.id}
                className={
                  "seg " +
                  (mode === o.id
                    ? "on"
                    : "")
                }
                onClick={() =>
                  setMode(o.id)
                }
                aria-pressed={
                  mode === o.id
                }
              >
                {o.label}
              </button>
            ))}

            <span className="soundGroup">
              <button
                className={
                  "seg muteBtn " +
                  (muted ? "muted" : "")
                }
                onClick={() =>
                  setMuted((v) => !v)
                }
                aria-pressed={muted}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M3,9 H7 L12,4.5 V19.5 L7,15 H3 Z"
                    fill="currentColor"
                  />

                  {muted ? (
                    <path
                      d="M16,9 L22,15 M22,9 L16,15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M15.5,8.5 Q18,12 15.5,15.5 M18.5,6 Q23,12 18.5,18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </svg>

                {muted
                  ? "Unmute"
                  : "Mute"}
              </button>
            </span>
          </div>

          <div className="controls">
            <div className="readout">
              <span className="readoutI">I</span>{" "}
              <span ref={readoutRef}>= +0.00 A</span>
            </div>

            <div className="toggles">
              <button
                className="switchBtn"
                onClick={() =>
                  setSlow((v) => !v)
                }
                aria-pressed={slow}
              >
                <span
                  className={
                    "toggle " +
                    (slow ? "on" : "")
                  }
                >
                  <span className="knob" />
                </span>

                Slow motion
              </button>

              <button
                className="switchBtn"
                onClick={() =>
                  setShowField(
                    (v) => !v
                  )
                }
                aria-pressed={showField}
              >
                <span
                  className={
                    "toggle green " +
                    (showField
                      ? "on"
                      : "")
                  }
                >
                  <span className="knob" />
                </span>

                Magnetic field lines
              </button>
            </div>

            <div className="status">
              <span
                className={
                  "dot " +
                  (sig === "1"
                    ? ""
                    : "on")
                }
              />

              {sig === "1"
                ? "1 Hz • low note"
                : sig === "2"
                  ? "2 Hz • higher note"
                  : "2 Hz + 3 Hz • a perfect fifth"}
            </div>
          </div>
        </section>

        <section className="lesson">
          <div className="lessonBox">
            <h2>
              1. The alternating current
            </h2>

            <p>
              The source keeps reversing its
              push, so the current rises,
              falls, and reverses in a smooth
              sinusoidal wave. Right now it
              completes{" "}
              <span className={sigClass}>
                {sig === "2+3"
                  ? "a blend of 2 and 3 cycles per second"
                  : sig === "1"
                    ? "1 cycle per second"
                    : "2 cycles per second"}
              </span>
              .
            </p>
          </div>

          <div className="lessonBox">
            <h2>
              2. The pressure wave
            </h2>

            <p>
              The current in the voice coil,
              which sits in the magnet's field,
              pushes the cone out when it is
              positive and pulls it back when
              it is negative. The cone moves
              the nearest air particles. Each
              particle only shifts about its
              own resting position (the dashed
              lines), but the squeezed and
              stretched regions travel outward,
              and the darker bands mark the
              squeezed, high-pressure air.{" "}

              {sig === "2+3" ? (
                <>
                  The{" "}
                  <span className={sigClass}>
                    2 Hz and 3 Hz
                  </span>{" "}
                  tones have different
                  wavelengths, so the air carries
                  both patterns at once. Their 3:2
                  ratio is a perfect fifth.
                </>
              ) : (
                <>
                  At{" "}
                  <span className={sigClass}>
                    {sigLabel}
                  </span>{" "}
                  the wavelength is{" "}
                  {sig === "1"
                    ? "long"
                    : "half as long"}.
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function LoudspeakerPreview() {
  return (
    <>
      <style>{`
        .loudspeakerPreview {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .loudspeakerPreview .page {
          min-height: 0;
          width: 100%;
          height: 100%;
          padding: 0;
          background: transparent;
        }

        .loudspeakerPreview .shell {
          width: 100%;
          height: 100%;
          max-width: none;
          margin: 0;
        }

        .loudspeakerPreview .heading,
        .loudspeakerPreview .backRow,
        .loudspeakerPreview .signalBar,
        .loudspeakerPreview .controls,
        .loudspeakerPreview .lesson {
          display: none !important;
        }

        .loudspeakerPreview .card {
          width: 100%;
          height: 100%;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          background: transparent;
          overflow: hidden;
        }

        .loudspeakerPreview .stage {
          width: 100%;
          height: 100%;
          padding: 0;
        }

        .loudspeakerPreview .stage svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>

      <div className="loudspeakerPreview">
        <ACCircuit disableSound disable3D />
      </div>
    </>
  );
}