import React, { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
   Electromagnetic Bell

   Exports:
     default                      the full interactive page
                                  (pass preview to get the preview instead)
     ElectromagneticBellPreview   compact looping preview, no text, no sound

   The mechanism is driven by a small physics simulation (current in the
   coil, force on the armature, the springy strip, the contacts and the
   gong), so slow motion, fast motion and step-by-step all show the same
   machine running at different speeds.

   solenoid.jsx is loaded with import("./solenoid.jsx") rather than a
   static import, so the page still runs where that file isn't available
   (for example as a stand-alone artifact). If it can't be loaded, a
   labelled rectangle stands in for the coil (see SolenoidFallback).

   The path is a plain string literal on purpose. Bundlers (Vite,
   webpack, esbuild) resolve a literal dynamic import at build time and
   emit the file as its own chunk, so it works in a production build.
   That is not the case for import(/* @vite-ignore *\/ someVariable),
   which the bundler skips and which then 404s at runtime.
   ------------------------------------------------------------------ */

const C = {
  ink: "#202020",
  amber: "#d97706",
  green: "#2d9b55",
  muted: "#59636f",
  grey: "#374151",
  copper: "#b86f32",
  metal: "#8f969d",
  metalDark: "#555c63",
  flow: "#ff2200",
};

/* ------------------------------------------------------------------
   Geometry (panel space, roughly 560 x 420 units)

   The springy strip, iron armature, contact blade and hammer all rotate
   together about the clamp at PIVOT. u = 0 is the rest position (contacts
   touching), u = 1 is the hammer resting on the gong.
   ------------------------------------------------------------------ */

const rad = (d) => (d * Math.PI) / 180;

const BASE_Y = 330; // top of the wooden baseboard
const STRIP_X = 380; // centre line of the springy strip
const STRIP_W = 6;
const PIVOT = { x: STRIP_X, y: 314 }; // top of the clamp block
const REST_DEG = 3.2; // strip leaning away from the coil at rest
const STRIKE_DEG = -1.2; // hammer touching the gong
const angleAt = (u) => REST_DEG + u * (STRIKE_DEG - REST_DEG);

const HAMMER = { y: 95, r: 11 };
const GONG_R = 78;
// The gong's rim sits exactly where the hammer arrives at u = 1
const GONG = {
  x:
    STRIP_X -
    HAMMER.r +
    (PIVOT.y - HAMMER.y) * Math.sin(rad(STRIKE_DEG)) -
    GONG_R,
  y: HAMMER.y,
  r: GONG_R,
};

// Iron armature: a block on the coil side of the strip
const ARM = { x: 365, y: 203, w: 12, h: 24 };

// Electromagnet (solenoid.jsx turned round so its core points at the
// armature and its leads hang downwards). The nose of the core stops just
// short of where the armature ends up when the hammer is on the gong.
const COIL_SCALE = 0.62;
const COIL_TURNS = 8;
const COIL_Y = ARM.y + ARM.h / 2;
const NOSE_X =
  ARM.x + (PIVOT.y - ARM.y) * Math.sin(rad(STRIKE_DEG)) - 0.8;
const COIL_X = NOSE_X + COIL_SCALE * 9.4; // solenoid "corner"
const LEAD_Y = COIL_Y + COIL_SCALE * 75.5;
const REAR_LEAD_X =
  COIL_X - COIL_SCALE * (60 + (COIL_TURNS - 1) * 20 - 5);
const FRONT_LEAD_X = COIL_X - COIL_SCALE * 66.5;
const COIL_CX = COIL_X - (COIL_SCALE * (9.4 + 60 + (COIL_TURNS - 1) * 20 + 18)) / 2;

// Contacts: a springy copper blade on the strip presses on the tip of the
// contact screw. It stays touching for the first part of the swing, then
// the gap opens (at u = U_BREAK).
const U_BREAK = 0.4;
const CONTACT_Y = 160;
const STRIP_EDGE = STRIP_X + STRIP_W / 2;
const stripEdgeAt = (u) =>
  STRIP_EDGE + (PIVOT.y - CONTACT_Y) * Math.sin(rad(angleAt(u)));
const SCREW_TIP_X = stripEdgeAt(0) + 6; // blade squashed to 6 units at rest
const BLADE_FREE = SCREW_TIP_X - stripEdgeAt(U_BREAK); // relaxed blade length

const PILLAR = { x: 470, w: 12, top: 148 };
const PILLAR_CX = PILLAR.x + PILLAR.w / 2;
const STAND_X = 286; // post that holds the gong and the electromagnet

// Circuit
const SW = { x1: 105, x2: 155, y: 300 }; // switch contacts
const BAT = { x: 70, plus: 328, minus: 337 };
const LOOP_Y = 372; // return wire under the baseboard
const RIGHT_X = 540;
const TERM_Y = 300; // terminal on the contact pillar

const RIPPLE_LIFE = 1.1; // s (real time)

/* ------------------------------------------------------------------
   Simulation (times in ms of circuit time)
   ------------------------------------------------------------------ */

const I_MAX = 0.8; // A, steady current with the contacts closed
const SIM = {
  tauRise: 5, // ms: the coil's inductance slows the rise
  tauFall: 0.5, // ms: current collapses as soon as the gap opens
  magnet: 0.0055, // force per (I / I_MAX)^2
  spring: 0.0016, // springy strip stiffness
  preload: 0.5, // the strip presses the contacts together at rest
  damping: 0.001,
  gongBounce: 0.35,
  stopBounce: 0.15,
};
const V_REF = 0.036; // typical impact speed, used to scale the sound
const SUBSTEP = 0.02; // ms
const SLOW_RATE = 1 / 35; // slow motion: 1 s on screen = 1/35 s of bell

function createSim() {
  return { t: 0, u: 0, v: 0, I: 0, contact: true };
}

// Advances the simulation by dt ms. Returns an event, if one happened.
function stepSim(s, dt, switchOn) {
  let ev = null;
  const closed = s.u <= U_BREAK;
  if (closed !== s.contact) {
    s.contact = closed;
    ev = { type: closed ? "close" : "open", t: s.t, I: s.I };
  }

  const target = switchOn && closed ? I_MAX : 0;
  const tau = target > s.I ? SIM.tauRise : SIM.tauFall;
  s.I += (target - s.I) * (1 - Math.exp(-dt / tau));

  const m = s.I / I_MAX;
  const a =
    SIM.magnet * m * m * (1 + 0.6 * s.u) -
    SIM.spring * (s.u + SIM.preload) -
    SIM.damping * s.v;
  s.v += a * dt;
  s.u += s.v * dt;
  s.t += dt;

  if (s.u > 1) {
    ev = { type: "strike", t: s.t, v: s.v };
    s.u = 1;
    s.v = -s.v * SIM.gongBounce;
  }
  if (s.u < 0) {
    s.u = 0;
    s.v = s.v < -0.002 ? -s.v * SIM.stopBounce : 0;
  }
  return ev;
}

/* ------------------------------------------------------------------
   Sound: a struck metal dome. A few inharmonic partials ring and decay;
   each strike briefly damps the gong (the hammer is touching it) and then
   excites it again. At real speed that gives the familiar "brrring".
   ------------------------------------------------------------------ */

const PARTIALS = [
  { f: 700, a: 0.5, tau: 1.3 },
  { f: 703.5, a: 0.35, tau: 1.5 }, // slightly detuned: a gentle shimmer
  { f: 1897, a: 0.3, tau: 0.6 },
  { f: 3605, a: 0.16, tau: 0.3 },
  { f: 5901, a: 0.07, tau: 0.15 },
];
const MASTER_VOLUME = 0.22;

class BellSound {
  constructor() {
    this.ctx = null;
    this.on = true;
  }

  // Must be called from a click or key press: browsers only allow audio
  // to start in response to the user.
  unlock() {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      try {
        this.build(new AC());
      } catch (e) {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  build(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.on ? MASTER_VOLUME : 0;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp);
    comp.connect(ctx.destination);

    this.partials = PARTIALS.map((p) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = p.f;
      const g = ctx.createGain();
      g.gain.value = 0;
      osc.connect(g);
      g.connect(this.master);
      osc.start();
      return { ...p, g, peak: 0, t0: 0 };
    });

    // A short burst of filtered noise for the "tick" of the hammer
    const len = Math.floor(ctx.sampleRate * 0.04);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  setOn(on) {
    this.on = on;
    if (this.ctx) {
      this.master.gain.setTargetAtTime(
        on ? MASTER_VOLUME : 0,
        this.ctx.currentTime,
        0.03
      );
    }
  }

  // strength ~ 1 for a normal blow; offset (s, <= 0) places the strike
  // where it happened inside the last animation frame
  strike(strength, offset = 0) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.on) return;
    const when = Math.max(
      ctx.currentTime + 0.005,
      ctx.currentTime + 0.035 + offset
    );

    this.partials.forEach((p) => {
      const cur =
        when > p.t0 ? p.peak * Math.exp(-(when - p.t0) / p.tau) : p.peak;
      const damped = cur * 0.3;
      const peak = Math.min(p.a, damped + p.a * strength * 0.8);
      const g = p.g.gain;
      g.cancelScheduledValues(when);
      g.setValueAtTime(cur, when);
      g.linearRampToValueAtTime(damped, when + 0.004);
      g.linearRampToValueAtTime(peak, when + 0.007);
      g.setTargetAtTime(0, when + 0.007, p.tau);
      p.peak = peak;
      p.t0 = when + 0.007;
    });

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3200;
    bp.Q.value = 1.2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.35 * strength, when);
    ng.gain.exponentialRampToValueAtTime(0.001, when + 0.03);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(this.master);
    src.start(when);
    src.stop(when + 0.05);
  }

  close() {
    if (this.ctx) this.ctx.close().catch(() => {});
    this.ctx = null;
  }
}

/* ------------------------------------------------------------------
   Animation loop shared by the page and the preview.

   params: { switchOn, rate, soundOn, sound }
   Returns [view, engine]. The engine lets the page reset the bell, and
   stop the clock at a chosen moment (step-by-step mode).
   ------------------------------------------------------------------ */

function makeView(e, now) {
  const s = e.sim;
  return {
    u: s.u,
    I: s.I,
    contact: s.contact,
    flowVis: e.flowVis,
    gongAmp: e.gongAmp,
    ripples: e.ripples.map((r) => ({ age: now - r.born, a: r.a })),
    flash: now < e.flashUntil,
    spark: now < e.sparkUntil,
    now,
    strikesPerSec: e.strikesPerSec,
  };
}

function useBellEngine(params) {
  const pRef = useRef(params);
  pRef.current = params;

  const engRef = useRef(null);
  if (!engRef.current) {
    engRef.current = {
      sim: createSim(),
      halted: false, // step-by-step: the clock is stopped
      stopWhen: null, // (sim, event) => true to stop the clock
      onHalt: null,
      flowVis: 0,
      gongAmp: 0,
      ripples: [],
      lastRipple: -1e9,
      flashUntil: 0,
      sparkUntil: 0,
      strikeTimes: [],
      strikesPerSec: 0,
      reset() {
        const t = this.sim.t;
        this.sim = createSim();
        this.sim.t = t;
      },
    };
  }

  const [view, setView] = useState(() => makeView(engRef.current, 0));

  useEffect(() => {
    let raf;
    let last = null;

    const tick = (ms) => {
      const now = ms / 1000;
      const dtReal = last == null ? 0 : Math.min(0.05, Math.max(0, now - last));
      last = now;

      const p = pRef.current;
      const e = engRef.current;
      const fast = p.rate > 0.2;
      const events = [];

      if (!e.halted && dtReal > 0) {
        const simDt = dtReal * 1000 * p.rate;
        const n = Math.max(1, Math.ceil(simDt / SUBSTEP));
        const h = simDt / n;
        for (let k = 0; k < n; k++) {
          const ev = stepSim(e.sim, h, p.switchOn);
          if (ev) events.push(ev);
          if (e.stopWhen && e.stopWhen(e.sim, ev)) {
            e.halted = true;
            e.stopWhen = null;
            if (e.onHalt) e.onHalt();
            break;
          }
        }
      }

      const s = e.sim;

      for (const ev of events) {
        if (ev.type === "strike") {
          const strength = Math.max(0.25, Math.min(1.2, ev.v / V_REF));
          if (p.soundOn && p.sound) {
            p.sound.strike(strength, (ev.t - s.t) / (p.rate * 1000));
          }
          e.gongAmp = Math.min(1, e.gongAmp * 0.6 + 0.75 * strength);
          if (now - e.lastRipple > (fast ? 0.14 : 0.05)) {
            e.ripples.push({ born: now, a: Math.min(1, strength) });
            e.lastRipple = now;
          }
          e.flashUntil = now + (fast ? 0.05 : 0.22);
          e.strikeTimes.push(ev.t);
        } else if (ev.type === "open") {
          if (ev.I > 0.3 * I_MAX) e.sparkUntil = now + (fast ? 0.04 : 0.2);
        }
      }

      // What's shown follows the circuit, smoothed in real time. At real
      // speed the current flickers ~20 times a second, faster than the
      // eye can follow, so it reads as an average.
      const m = s.I / I_MAX;
      e.flowVis +=
        (m - e.flowVis) * (1 - Math.exp(-dtReal / (fast ? 0.09 : 0.015)));
      e.gongAmp *= Math.exp(-dtReal / 0.7);
      e.ripples = e.ripples.filter((r) => now - r.born < RIPPLE_LIFE);

      e.strikeTimes = e.strikeTimes.filter((t) => t > s.t - 1000);
      e.strikesPerSec = e.strikeTimes.length;

      setView(makeView(e, now));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return [view, engRef.current];
}

/* ------------------------------------------------------------------
   Magnetic field image: magneticFieldLines.png when it loads, nothing
   otherwise (same graceful-bypass pattern as solenoid.jsx).
   ------------------------------------------------------------------ */

let fieldImgResult = null; // { url } once settled; url is null on failure
let fieldImgPromise = null;

function loadFieldImg() {
  if (!fieldImgPromise) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("magneticFieldLines.png timed out")), 4000)
    );
    fieldImgPromise = Promise.race([import("./magneticFieldLines.png"), timeout])
      .then((m) => {
        const url = m && (typeof m.default === "string" ? m.default : null);
        fieldImgResult = { url };
        return fieldImgResult;
      })
      .catch(() => {
        fieldImgResult = { url: null };
        return fieldImgResult;
      });
  }
  return fieldImgPromise;
}

function useMagneticFieldImg() {
  const [result, setResult] = useState(fieldImgResult);
  useEffect(() => {
    if (result) return undefined;
    let live = true;
    loadFieldImg().then((r) => live && setResult(r));
    return () => { live = false; };
  }, [result]);
  return result ? result.url : null;
}

/* ------------------------------------------------------------------
   The coil: solenoid.jsx when it loads, a labelled rectangle otherwise
   ------------------------------------------------------------------ */

let solenoidResult = null; // { Comp } once settled; Comp is null on failure
let solenoidPromise = null;

function loadSolenoid() {
  if (!solenoidPromise) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("solenoid.jsx timed out")), 4000)
    );
    solenoidPromise = Promise.race([import("./solenoid.jsx"), timeout])
      .then((m) => {
        const Comp = m && typeof m.default === "function" ? m.default : null;
        solenoidResult = { Comp };
        return solenoidResult;
      })
      .catch(() => {
        solenoidResult = { Comp: null };
        return solenoidResult;
      });
  }
  return solenoidPromise;
}

function Coil(props) {
  const [result, setResult] = useState(solenoidResult);

  useEffect(() => {
    if (result) return undefined;
    let live = true;
    loadSolenoid().then((r) => live && setResult(r));
    return () => {
      live = false;
    };
  }, [result]);

  // Nothing is drawn for the moment it takes to find out, so the
  // rectangle doesn't flash up before the real coil appears
  if (!result) return null;
  return result.Comp ? <result.Comp {...props} /> : <SolenoidFallback {...props} />;
}

// Takes the same props as solenoid.jsx and covers the same footprint: a
// body where the turns and core would be, and the two leads, which end
// exactly where the real ones do so the wires still meet them.
function SolenoidFallback({
  on = true,
  reverse = false,
  corner = { x: 75, y: 230 },
  orientation = 270,
  mirror = false,
  scale = 0.5,
  turns: turnCount = 20,
}) {
  const count = Math.max(1, Math.min(31, Math.round(turnCount)));
  const lastTurnX = 60 + (count - 1) * 20;
  const left = 9.4;
  const right = lastTurnX + 18;
  const leads = [66.5, lastTurnX - 5];

  // Local solenoid coordinates to the parent's, so the label can be
  // drawn upright whatever the orientation and mirroring
  const sx = mirror ? -scale : scale;
  const a = rad(orientation);
  const toParent = (lx, ly) => ({
    x: corner.x + sx * lx * Math.cos(a) - scale * ly * Math.sin(a),
    y: corner.y + sx * lx * Math.sin(a) + scale * ly * Math.cos(a),
  });
  const mid = toParent((left + right) / 2, 0);

  // Current runs in at the rear lead and out at the front one
  const leadPath = (x, inward) =>
    inward ? `M${x},-75.5 L${x},-34` : `M${x},-34 L${x},-75.5`;

  return (
    <g role="img" aria-label="Solenoid (placeholder)">
      <g transform={`translate(${corner.x} ${corner.y}) rotate(${orientation}) scale(${sx} ${scale})`}>
        <rect
          x={left}
          y="-34"
          width={right - left}
          height="68"
          rx="6"
          fill="#fbeee0"
          stroke={C.copper}
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
        {leads.map((x) => (
          <path
            key={`lead-${x}`}
            d={leadPath(x, x !== 66.5)}
            fill="none"
            stroke={C.copper}
            strokeWidth="2.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {on &&
          leads.map((x) => (
            <path
              key={`flow-${x}`}
              d={leadPath(x, x !== 66.5)}
              fill="none"
              stroke={C.flow}
              strokeWidth="1.7"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="bell-flow"
              style={reverse ? { animationDirection: "reverse" } : undefined}
            />
          ))}
      </g>
      <text
        x={mid.x}
        y={mid.y}
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
        fill={C.copper}
        pointerEvents="none"
      >
        solenoid
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------
   One wire: an ink line, with the animated current overlay on top
   ------------------------------------------------------------------ */

function Wire({ d, flowing }) {
  return (
    <>
      <path d={d} fill="none" stroke={C.ink} strokeWidth="3.6" strokeLinejoin="round" />
      {flowing && (
        <path
          d={d}
          fill="none"
          stroke={C.flow}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="bell-flow"
        />
      )}
    </>
  );
}

// Arc around the gong, from 165° round the top to 335°
function rippleArc(r) {
  const a0 = rad(165);
  const a1 = rad(335);
  const x0 = GONG.x + r * Math.cos(a0);
  const y0 = GONG.y + r * Math.sin(a0);
  const x1 = GONG.x + r * Math.cos(a1);
  const y1 = GONG.y + r * Math.sin(a1);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r.toFixed(2)},${r.toFixed(2)} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

/* ------------------------------------------------------------------
   The moving part: springy strip, contact blade, armature and hammer.
   Drawn upright; the caller rotates it about PIVOT.
   ------------------------------------------------------------------ */

function StripParts({ ext, flowing, ghost = false }) {
  const bladeBaseY = CONTACT_Y + 18;
  const tipX = STRIP_EDGE + ext;
  const blade = `M${STRIP_EDGE},${bladeBaseY} Q${tipX},${bladeBaseY} ${tipX - 2},${CONTACT_Y + 2}`;

  return (
    <g>
      {/* Springy steel strip, ending in the hammer */}
      <rect
        x={STRIP_X - STRIP_W / 2}
        y={HAMMER.y}
        width={STRIP_W}
        height={PIVOT.y + 10 - HAMMER.y}
        rx="1.5"
        fill="url(#bellStripGrad)"
        stroke="#4b5563"
        strokeWidth="0.9"
      />

      {!ghost && (
        <>
          {/* Copper contact blade and its contact */}
          <path d={blade} fill="none" stroke="#7a4219" strokeWidth="3" strokeLinecap="round" />
          <path d={blade} fill="none" stroke={C.copper} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx={tipX - 2.2} cy={CONTACT_Y} r="2.6" fill="#d59658" stroke="#7a4219" strokeWidth="0.8" />
        </>
      )}

      {/* Iron armature */}
      <rect
        x={ARM.x}
        y={ARM.y}
        width={ARM.w}
        height={ARM.h}
        rx="1.6"
        fill="url(#bellIronGrad)"
        stroke="#5f564a"
        strokeWidth="1.1"
      />
      {!ghost && (
        <>
          <circle cx={ARM.x + ARM.w - 2} cy={ARM.y + 5} r="1.3" fill="#4b5563" />
          <circle cx={ARM.x + ARM.w - 2} cy={ARM.y + ARM.h - 5} r="1.3" fill="#4b5563" />
        </>
      )}

      {/* Hammer */}
      <circle cx={STRIP_X} cy={HAMMER.y} r={HAMMER.r} fill="url(#bellHammerGrad)" stroke="#1f2937" strokeWidth="1.1" />
      {!ghost && (
        <ellipse cx={STRIP_X - 3.5} cy={HAMMER.y - 4} rx="3.6" ry="2.4" fill="#fff" opacity="0.45" />
      )}

      {/* Current up the strip and across the blade */}
      {flowing && !ghost && (
        <>
          <path
            d={`M${STRIP_X},${PIVOT.y + 6} V${bladeBaseY} H${STRIP_EDGE}`}
            fill="none"
            stroke={C.flow}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="bell-flow"
          />
          <path d={blade} fill="none" stroke={C.flow} strokeWidth="1.3" strokeLinecap="round" className="bell-flow" />
        </>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------
   The bell panel
   ------------------------------------------------------------------ */

function Panel({
  u = 0,
  contact = true,
  switchOn = false,
  flowVis = 0,
  gongAmp = 0,
  ripples = [],
  now = 0,
  flash = false,
  spark = false,
  blur = false, // real speed: show faint copies at both ends of the swing
  showLabels = true,
  interactive = false, // the switch can be clicked
  onToggleSwitch,
  reduceMotion = false,
}) {
  const angle = angleAt(u);
  const ext = Math.min(BLADE_FREE, SCREW_TIP_X - stripEdgeAt(u));
  const fieldVis = flowVis;
  const fieldImgUrl = useMagneticFieldImg();

  // The gong shivers while it rings (a stand-in for a vibration far too
  // fast to draw), and a bright rim pulses with it
  const shake = reduceMotion ? 0 : gongAmp;
  const jx = shake * 1.4 * Math.sin(2 * Math.PI * 26 * now);
  const jy = shake * 0.6 * Math.sin(2 * Math.PI * 31 * now + 1);
  const rimPulse = Math.abs(Math.sin(2 * Math.PI * 13 * now));

  const flowStyle = { "--bell-flow": Math.min(1, flowVis).toFixed(3) };

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onToggleSwitch && onToggleSwitch();
    }
  };

  return (
    <g className="bell-panel" style={flowStyle}>
      <defs>
        <radialGradient id="bellGongGrad" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset="0.25" stopColor="#f0cf6a" />
          <stop offset="0.6" stopColor="#c9992e" />
          <stop offset="0.9" stopColor="#96701a" />
          <stop offset="1" stopColor="#6f5212" />
        </radialGradient>
        <radialGradient id="bellBossGrad" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff8d8" />
          <stop offset="0.45" stopColor="#e2b94c" />
          <stop offset="1" stopColor="#a17a1f" />
        </radialGradient>
        <radialGradient id="bellHammerGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#d1d5db" />
          <stop offset="0.45" stopColor="#6b7280" />
          <stop offset="1" stopColor="#1f2937" />
        </radialGradient>
        <linearGradient id="bellStripGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b7280" />
          <stop offset="0.45" stopColor="#e5e7eb" />
          <stop offset="1" stopColor="#6b7280" />
        </linearGradient>
        <linearGradient id="bellIronGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b6358" />
          <stop offset="0.12" stopColor="#cdc3b1" />
          <stop offset="0.35" stopColor="#a39885" />
          <stop offset="0.7" stopColor="#6d6456" />
          <stop offset="1" stopColor="#574f44" />
        </linearGradient>
        <linearGradient id="bellBrassGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9a7420" />
          <stop offset="0.4" stopColor="#f2d47a" />
          <stop offset="1" stopColor="#8a6618" />
        </linearGradient>
        <linearGradient id="bellPostGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#555c63" />
          <stop offset="0.45" stopColor="#c4c9cf" />
          <stop offset="1" stopColor="#555c63" />
        </linearGradient>
        <linearGradient id="bellWoodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a66b" />
          <stop offset="0.5" stopColor="#c08850" />
          <stop offset="1" stopColor="#9a6634" />
        </linearGradient>
        <radialGradient id="bellFieldGlow">
          <stop offset="0" stopColor="#6d7fe0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#6d7fe0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sound spreading out from the gong */}
      {ripples.map((r, i) => {
        const p = Math.min(1, r.age / RIPPLE_LIFE);
        return (
          <path
            key={i}
            d={rippleArc(GONG.r + 6 + p * 52)}
            fill="none"
            stroke="#c9992e"
            strokeWidth={2 - p}
            strokeLinecap="round"
            opacity={(1 - p) * 0.6 * r.a}
          />
        );
      })}

      {/* Wooden baseboard */}
      <rect x="170" y={BASE_Y} width="335" height="18" rx="3" fill="url(#bellWoodGrad)" stroke="#7a4f24" strokeWidth="1.1" />
      <path d={`M182,${BASE_Y + 6} H300 M330,${BASE_Y + 11} H470 M200,${BASE_Y + 14} H260`} stroke="#a46f3b" strokeWidth="0.8" opacity="0.6" />

      {/* Post holding the gong (behind) and the electromagnet */}
      <rect x={STAND_X - 4} y={GONG.y} width="8" height={BASE_Y - GONG.y} fill="url(#bellPostGrad)" stroke="#4b5563" strokeWidth="0.8" />
      <rect x={STAND_X - 9} y={BASE_Y - 6} width="18" height="6" rx="1.5" fill="#6b7280" stroke="#374151" strokeWidth="0.8" />

      {/* Magnetic field around the electromagnet */}
      <g
        fill="none"
        stroke="#5b6fd6"
        strokeWidth="1.1"
        strokeDasharray="4 4"
        style={{ opacity: 0.75 * fieldVis }}
        pointerEvents="none"
      >
        <ellipse cx={COIL_CX} cy={COIL_Y} rx="84" ry="33" />
        <ellipse cx={COIL_CX} cy={COIL_Y} rx="100" ry="45" />
      </g>

      {/* Wires, in the direction the current flows */}
      <Wire d={`M${BAT.x},${BAT.plus} V${SW.y} H${SW.x1}`} flowing={switchOn} />
      <Wire d={`M${SW.x2},${SW.y} H${REAR_LEAD_X} V${LEAD_Y}`} flowing={switchOn} />
      <Wire d={`M${FRONT_LEAD_X},${LEAD_Y} V322 H368`} flowing={switchOn} />
      <Wire
        d={`M${PILLAR.x + PILLAR.w},${TERM_Y} H${RIGHT_X} V${LOOP_Y} H${BAT.x} V${BAT.minus}`}
        flowing={switchOn}
      />

      {/* Battery */}
      <g stroke={C.ink} strokeLinecap="round">
        <line x1={BAT.x - 14} y1={BAT.plus} x2={BAT.x + 14} y2={BAT.plus} strokeWidth="2.4" />
        <line x1={BAT.x - 8} y1={BAT.minus} x2={BAT.x + 8} y2={BAT.minus} strokeWidth="5" />
      </g>

      {/* Switch contacts (the lever is drawn on top, further down) */}
      <circle cx={SW.x1} cy={SW.y} r="4.4" fill={C.ink} />
      <circle cx={SW.x2} cy={SW.y} r="4.4" fill={C.ink} />

      {/* Electromagnet */}
      <Coil
        on={switchOn}
        reverse={false}
        corner={{ x: COIL_X, y: COIL_Y }}
        orientation={180}
        mirror={false}
        scale={COIL_SCALE}
        turns={COIL_TURNS}
      />
      <circle
        cx={NOSE_X}
        cy={COIL_Y}
        r="20"
        fill="url(#bellFieldGlow)"
        style={{ opacity: fieldVis }}
        pointerEvents="none"
      />

      {/* Magnetic field lines image overlay — shown when current is flowing */}
      {fieldImgUrl && (
        <image
          href={fieldImgUrl}
          x={COIL_CX - 142}
          y={COIL_Y - 84}
          width="284"
          height="168"
          preserveAspectRatio="xMidYMid meet"
          style={{ opacity: fieldVis * 0.55, mixBlendMode: "multiply" }}
          pointerEvents="none"
        />
      )}

      {/* Clamp holding the bottom of the springy strip */}
      <rect x="368" y={PIVOT.y} width="24" height={BASE_Y - PIVOT.y} rx="1.5" fill="url(#bellBrassGrad)" stroke="#6b4f12" strokeWidth="1" />

      {/* Contact screw in its pillar */}
      <rect x={PILLAR.x} y={PILLAR.top} width={PILLAR.w} height={BASE_Y - PILLAR.top} rx="1.5" fill="url(#bellBrassGrad)" stroke="#6b4f12" strokeWidth="1" />
      <rect x={PILLAR.x - 5} y={BASE_Y - 6} width={PILLAR.w + 10} height="6" rx="1.5" fill="#a17a1f" stroke="#6b4f12" strokeWidth="0.8" />
      <rect x={SCREW_TIP_X + 3} y={CONTACT_Y - 3} width={PILLAR.x - SCREW_TIP_X - 3} height="6" fill="url(#bellPostGrad)" stroke="#4b5563" strokeWidth="0.7" />
      <path
        d={Array.from({ length: Math.floor((PILLAR.x - SCREW_TIP_X - 8) / 4) }, (_, k) => {
          const x = SCREW_TIP_X + 6 + k * 4;
          return `M${x},${CONTACT_Y - 3} L${x + 2},${CONTACT_Y + 3}`;
        }).join(" ")}
        stroke="#4b5563"
        strokeWidth="0.6"
        opacity="0.7"
      />
      <polygon
        points={`${SCREW_TIP_X},${CONTACT_Y} ${SCREW_TIP_X + 3.5},${CONTACT_Y - 3} ${SCREW_TIP_X + 3.5},${CONTACT_Y + 3}`}
        fill="#e5e7eb"
        stroke="#4b5563"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <rect x={PILLAR.x - 6} y={CONTACT_Y - 5} width="6" height="10" rx="1" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.7" />
      <rect x={PILLAR.x + PILLAR.w} y={CONTACT_Y - 6.5} width="10" height="13" rx="2" fill="url(#bellPostGrad)" stroke="#374151" strokeWidth="0.8" />
      <path d={`M${PILLAR.x + PILLAR.w + 3},${CONTACT_Y - 6} V${CONTACT_Y + 6} M${PILLAR.x + PILLAR.w + 5.5},${CONTACT_Y - 6} V${CONTACT_Y + 6} M${PILLAR.x + PILLAR.w + 8},${CONTACT_Y - 6} V${CONTACT_Y + 6}`} stroke="#4b5563" strokeWidth="0.6" />
      <circle cx={PILLAR.x + PILLAR.w} cy={TERM_Y} r="2.6" fill="#6b7280" stroke="#374151" strokeWidth="0.7" />
      {switchOn && (
        <path
          d={`M${SCREW_TIP_X + 1},${CONTACT_Y} H${PILLAR_CX} V${TERM_Y} H${PILLAR.x + PILLAR.w}`}
          fill="none"
          stroke={C.flow}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="bell-flow"
        />
      )}

      {/* Gong */}
      <g transform={`translate(${(GONG.x + jx).toFixed(2)} ${(GONG.y + jy).toFixed(2)})`}>
        <circle r={GONG.r} fill="url(#bellGongGrad)" stroke="#6b4f12" strokeWidth="1.6" />
        <circle r={GONG.r - 9} fill="none" stroke="#8a6a1c" strokeOpacity="0.5" strokeWidth="1" />
        <circle r={GONG.r - 46} fill="url(#bellBossGrad)" stroke="#8a6a1c" strokeWidth="1" />
        <ellipse cx={-GONG.r * 0.34} cy={-GONG.r * 0.42} rx="20" ry="9" transform={`rotate(-38 ${-GONG.r * 0.34} ${-GONG.r * 0.42})`} fill="#fff" opacity="0.32" />
        <polygon
          points={Array.from({ length: 6 }, (_, k) => {
            const a = rad(60 * k + 30);
            return `${(7 * Math.cos(a)).toFixed(2)},${(7 * Math.sin(a)).toFixed(2)}`;
          }).join(" ")}
          fill="#9ca3af"
          stroke="#4b5563"
          strokeWidth="0.9"
        />
        <circle r="2.6" fill="#4b5563" />
        {gongAmp > 0.02 && (
          <circle
            r={GONG.r + 1.5 + rimPulse * 1.6 * gongAmp}
            fill="none"
            stroke="#f5a524"
            strokeWidth={1 + 1.6 * gongAmp}
            opacity={Math.min(0.75, gongAmp * 0.9)}
          />
        )}
      </g>

      {/* At real speed the strip is a blur: faint copies at both ends */}
      {blur && (
        <g opacity="0.17" pointerEvents="none">
          <g transform={`rotate(${REST_DEG} ${PIVOT.x} ${PIVOT.y})`}>
            <StripParts ext={0} flowing={false} ghost />
          </g>
          <g transform={`rotate(${STRIKE_DEG} ${PIVOT.x} ${PIVOT.y})`}>
            <StripParts ext={0} flowing={false} ghost />
          </g>
        </g>
      )}

      {/* The moving part */}
      <g transform={`rotate(${angle.toFixed(4)} ${PIVOT.x} ${PIVOT.y})`}>
        <StripParts ext={ext} flowing={switchOn} />
      </g>

      {/* Front of the clamp, over the bottom of the strip */}
      <rect x="368" y={PIVOT.y} width="24" height="7" fill="url(#bellBrassGrad)" stroke="#6b4f12" strokeWidth="1" />
      <circle cx="374" cy={PIVOT.y + 3.5} r="1.6" fill="#6b4f12" />
      <circle cx="386" cy={PIVOT.y + 3.5} r="1.6" fill="#6b4f12" />
      <circle cx="368" cy="322" r="2.6" fill="#6b7280" stroke="#374151" strokeWidth="0.7" />

      {/* Hammer hitting the gong */}
      {flash && (
        <g stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" pointerEvents="none">
          {[-75, -45, 45, 75].map((d) => {
            const a = rad(d);
            const x = GONG.x + GONG.r;
            return (
              <line
                key={d}
                x1={x + 14 * Math.cos(a)}
                y1={GONG.y + 14 * Math.sin(a)}
                x2={x + 24 * Math.cos(a)}
                y2={GONG.y + 24 * Math.sin(a)}
              />
            );
          })}
        </g>
      )}

      {/* A tiny spark as the contacts part */}
      {spark && (
        <g pointerEvents="none">
          <circle cx={SCREW_TIP_X - 2} cy={CONTACT_Y} r="5" fill="#fde68a" opacity="0.85" />
          <path
            d={`M${SCREW_TIP_X - 9},${CONTACT_Y} H${SCREW_TIP_X + 5} M${SCREW_TIP_X - 2},${CONTACT_Y - 7} V${CONTACT_Y + 7} M${SCREW_TIP_X - 7},${CONTACT_Y - 5} L${SCREW_TIP_X + 3},${CONTACT_Y + 5} M${SCREW_TIP_X - 7},${CONTACT_Y + 5} L${SCREW_TIP_X + 3},${CONTACT_Y - 5}`}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Switch lever */}
      <g
        style={{
          transformOrigin: `${SW.x1}px ${SW.y}px`,
          transform: `rotate(${switchOn ? 0 : -32}deg)`,
          transition: "transform 0.3s cubic-bezier(.3,1.3,.5,1)",
        }}
      >
        <line x1={SW.x1} y1={SW.y} x2={SW.x2} y2={SW.y} stroke={C.ink} strokeWidth="4.6" strokeLinecap="round" />
      </g>
      {interactive && (
        <>
          {!switchOn && (
            <rect
              className="bell-pulse"
              x={SW.x1 + 22}
              y={SW.y - 36}
              width="30"
              height="22"
              rx="6"
              fill="none"
              stroke={C.amber}
              strokeWidth="1.6"
            />
          )}
          <rect
            x={SW.x1 - 10}
            y={SW.y - 42}
            width={SW.x2 - SW.x1 + 22}
            height="52"
            fill="transparent"
            role="button"
            tabIndex={0}
            aria-label={switchOn ? "Open the switch" : "Close the switch"}
            aria-pressed={switchOn}
            style={{ cursor: "pointer" }}
            onClick={onToggleSwitch}
            onKeyDown={onKey}
          />
        </>
      )}

      {showLabels && (
        <g fontSize="10.5" fill={C.ink} pointerEvents="none">
          <text x="150" y="36">Gong</text>
          <line x1="176" y1="33" x2={GONG.x - 54} y2={GONG.y - 54} stroke={C.ink} strokeWidth="0.8" />

          <text x="416" y={HAMMER.y + 4}>Hammer</text>
          <line x1="413" y1={HAMMER.y} x2="405" y2={HAMMER.y} stroke={C.ink} strokeWidth="0.8" />

          <text x="412" y="140">Contact screw</text>

          <text x="398" y="185" fontSize="9.5" fill={C.grey}>Contacts</text>
          <text x="398" y="196" fontSize="9.5" fontWeight="700" fill={blur ? C.amber : contact ? "#19743b" : "#9b5d13"}>
            {blur ? "make & break" : contact ? "touching" : "apart"}
          </text>

          <text x="398" y="222">Iron</text>
          <text x="398" y="233">armature</text>
          <line x1="395" y1="219" x2={ARM.x + 4} y2={ARM.y + 6} stroke={C.ink} strokeWidth="0.8" />

          <text x="398" y="268">Springy</text>
          <text x="398" y="279">strip</text>
          <line x1="395" y1="265" x2="384" y2="262" stroke={C.ink} strokeWidth="0.8" />

          <text x={COIL_X - 145} y={COIL_Y - 2} textAnchor="end">Electro-</text>
          <text x={COIL_X - 145} y={COIL_Y + 9} textAnchor="end">magnet</text>

          <text x={BAT.x - 20} y={BAT.plus + 8} textAnchor="end">Battery</text>
          <text x={BAT.x + 17} y={BAT.plus - 3} fontSize="9" fill={C.grey}>+</text>

          <text x={(SW.x1 + SW.x2) / 2} y={SW.y - 39} textAnchor="middle">Switch</text>
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------
   Step-by-step: one ring of the bell, broken into moments. Each step
   runs the bell (in slow motion) until its moment arrives, then stops
   the clock until the user clicks Next.
   ------------------------------------------------------------------ */

const RING_GUIDE = [
  {
    title: "Current flows",
    body:
      "Closing the switch completes the circuit. Current flows from the battery, through the coil, up the springy strip and across the contacts. The coil becomes an electromagnet.",
    until: (s) => s.I >= 0.85 * I_MAX,
  },
  {
    title: "The armature is attracted",
    body:
      "The electromagnet pulls the iron armature towards it, bending the springy strip. The hammer starts to swing towards the gong.",
    until: (s) => s.u >= 0.3,
  },
  {
    title: "The contacts separate",
    body:
      "As the strip moves, the contacts are pulled apart. The circuit is broken, so the current stops and the electromagnet switches off. A tiny spark can jump across the gap.",
    until: (s) => !s.contact && s.I < 0.03 * I_MAX,
  },
  {
    title: "The hammer hits the gong",
    body:
      "The armature is still moving, so the hammer carries on and strikes the gong. The gong vibrates and gives out a sound.",
    until: (s, ev) => !!ev && ev.type === "strike",
  },
  {
    title: "The strip springs back",
    body:
      "With the electromagnet off, nothing holds the armature. The springy strip pushes it back until the contacts touch again.",
    until: (s, ev) => !!ev && ev.type === "close",
  },
  {
    title: "…and it all happens again",
    body:
      "The circuit is complete again, so current flows, the electromagnet switches back on and the cycle repeats: about 20 times a second in a real bell.",
    until: (s) => s.I >= 0.85 * I_MAX,
  },
];

/* ------------------------------------------------------------------
   Compact looping preview: only the bell mechanism, no text, no sound.
   ------------------------------------------------------------------ */

const PANEL_VIEWBOX = "10 -46 560 432";

export function ElectromagneticBellPreview() {
  const [switchOn, setSwitchOn] = useState(true);

  useEffect(() => {
    let t;
    const cycle = (on) => {
      setSwitchOn(on);
      t = setTimeout(() => cycle(!on), on ? 6000 : 2000);
    };
    cycle(true);
    return () => clearTimeout(t);
  }, []);

  const [view] = useBellEngine({ switchOn, rate: SLOW_RATE, soundOn: false });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{keyframes}</style>
      <svg
        viewBox={PANEL_VIEWBOX}
        style={{ display: "block", width: "100%", height: "100%" }}
        role="img"
        aria-label="Electromagnetic bell preview"
      >
        <Panel {...view} switchOn={switchOn} showLabels={false} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------
   Full interactive page
   ------------------------------------------------------------------ */

export default function ElectromagneticBell(props) {
  return props && props.preview ? (
    <ElectromagneticBellPreview />
  ) : (
    <ElectromagneticBellPage {...props} />
  );
}

function SpeakerIcon({ on }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
      {on ? (
        <path d="M11 5.5c1 .8 1.5 1.6 1.5 2.5s-.5 1.7-1.5 2.5M12.8 3.5c1.5 1.2 2.2 2.7 2.2 4.5s-.7 3.3-2.2 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <path d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  );
}

function ElectromagneticBellPage({ onBack }) {
  const [switchOn, setSwitchOn] = useState(false);
  const [speed, setSpeed] = useState("slow"); // "slow" | "fast"
  const [soundOn, setSoundOn] = useState(true);
  const [maximised, setMaximised] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [guide, setGuide] = useState(null); // { index } while stepping
  const [frozen, setFrozen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const cardRef = useRef(null);
  const guideRef = useRef(null);
  guideRef.current = guide;

  const soundRef = useRef(null);
  if (!soundRef.current) soundRef.current = new BellSound();
  const sound = soundRef.current;

  // Step-by-step always runs in slow motion so each moment can be seen
  const rate = guide || speed === "slow" ? SLOW_RATE : 1;
  const fast = rate > 0.2;

  const [view, engine] = useBellEngine({
    switchOn,
    rate,
    soundOn,
    sound,
  });

  useEffect(() => {
    engine.onHalt = () => setFrozen(true);
    return () => {
      engine.onHalt = null;
    };
  }, [engine]);

  useEffect(() => sound.setOn(soundOn), [soundOn, sound]);
  useEffect(() => () => sound.close(), [sound]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    return () => mq.removeEventListener && mq.removeEventListener("change", update);
  }, []);

  // Maximise: real full screen where the browser allows it, a CSS
  // full-window overlay otherwise. Esc leaves either.
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setMaximised(false);
    };
    const onKey = (e) => {
      // Esc closes a step-by-step walkthrough first, full screen second
      if (e.key === "Escape" && !guideRef.current) setMaximised(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleMaximise = () => {
    if (maximised) {
      setMaximised(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      return;
    }
    setMaximised(true);
    const el = cardRef.current;
    if (el && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        /* not allowed here: the CSS overlay is used instead */
      });
    }
  };

  const toggleSwitch = () => {
    if (guide) return;
    sound.unlock();
    setSwitchOn((v) => !v);
  };

  const chooseSpeed = (s) => {
    sound.unlock();
    setSpeed(s);
  };

  const toggleSound = () => {
    sound.unlock();
    setSoundOn((v) => !v);
  };

  const toggleStepMode = () => {
    if (guide) return;
    setStepMode((v) => {
      // Entering step-by-step: stop the bell so a walkthrough starts clean
      if (!v) setSwitchOn(false);
      return !v;
    });
  };

  const startGuide = () => {
    sound.unlock();
    engine.reset();
    engine.halted = false;
    engine.stopWhen = RING_GUIDE[0].until;
    setFrozen(false);
    setGuide({ index: 0 });
    setSwitchOn(true);
  };

  const endGuide = () => {
    engine.stopWhen = null;
    engine.halted = false;
    engine.reset();
    setFrozen(false);
    setGuide(null);
    setSwitchOn(false);
  };

  const nextStep = () => {
    const g = guideRef.current;
    if (!g || !engine.halted) return;
    const i = g.index + 1;
    if (i >= RING_GUIDE.length) {
      endGuide();
      return;
    }
    engine.stopWhen = RING_GUIDE[i].until;
    engine.halted = false;
    setFrozen(false);
    setGuide({ index: i });
  };

  // Enter / Space / arrow advances a step; Esc leaves step-by-step mode
  useEffect(() => {
    if (!guide) return undefined;
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "button" || tag === "input") return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "Escape") {
        e.preventDefault();
        endGuide();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guide]);

  const currentOn = switchOn && view.I > 0.1 * I_MAX;
  const ringing = switchOn && view.strikesPerSec > 0;
  const perSec = Math.max(1, Math.round(view.strikesPerSec));

  let status;
  if (guide) {
    status = frozen
      ? "Stepping through • time is paused on each moment"
      : "Stepping through • running to the next moment…";
  } else if (!switchOn) {
    status = "Switch open • no current • the bell is silent";
  } else if (fast) {
    status = ringing
      ? `Ringing • about ${perSec} strikes per second`
      : "Switch closed • starting to ring";
  } else {
    status = view.contact
      ? "Contacts touching • current flowing"
      : "Contacts apart • no current";
  }

  const guideStep = guide ? RING_GUIDE[guide.index] : null;
  const lastStep = guide && guide.index === RING_GUIDE.length - 1;

  return (
    <main className="page">
      <style>{`
        * { box-sizing: border-box; }
        /* A click never leaves a ring behind; keyboard focus always shows
           one. :focus-visible only matches when focus arrived from the
           keyboard, so pointer users see nothing. */
        button, [role="button"], [role="switch"], [role="radio"] {
          outline: none;
        }
        button::-moz-focus-inner { border: 0; }
        button:focus-visible,
        [role="button"]:focus-visible,
        [role="switch"]:focus-visible,
        [role="radio"]:focus-visible {
          outline: 2px solid #2166d1;
          outline-offset: 2px;
          border-radius: 4px;
        }
        html, body, #root {
          margin: 0 !important;
          width: 100%;
          min-height: 100%;
          background: #f3f5f7 !important;
        }
        body { overflow-x: hidden; }
        button { font: inherit; }

        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f3f5f7;
          color: #202020;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .shell { max-width: 1160px; margin: 0 auto; }
        .heading { margin-bottom: 18px; }
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
          color: ${C.ink};
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.1;
          letter-spacing: -.04em;
        }
        .intro {
          max-width: 780px;
          margin: 8px auto 0;
          text-align: center;
          color: ${C.muted};
          line-height: 1.5;
          font-size: 14px;
        }
        .card {
          position: relative;
          background: #fff;
          border: 1px solid #d9dee4;
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(31, 41, 55, .07);
          overflow: hidden;
        }
        .maxBtn {
          position: absolute;
          top: 10px;
          right: 12px;
          z-index: 2;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d9dee4;
          border-radius: 8px;
          background: #fff;
          color: ${C.ink};
          cursor: pointer;
        }
        .maxBtn:hover { background: #eef1f5; }

        .card.max {
          position: fixed;
          inset: 0;
          z-index: 1000;
          border-radius: 0;
          border: 0;
          display: flex;
          flex-direction: column;
        }
        .card.max .stage {
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card.max .stage svg {
          width: 100%;
          height: 100%;
          max-width: none;
        }

        .backRow { padding: 14px 18px 0; }
        .backButton {
          border: 0;
          background: transparent;
          color: ${C.muted};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
        }
        .stage { padding: 12px; position: relative; }
        .stage svg { display: block; width: 100%; max-width: 860px; height: auto; margin: 0 auto; }

        /* Step-by-step: the clock is stopped, so stop the flow dashes too */
        .stage.frozen .bell-flow,
        .stage.frozen .solenoid-current-flow {
          animation-play-state: paused;
        }

        .stepPop {
          position: absolute;
          left: 16px;
          top: 16px;
          width: min(330px, calc(100% - 32px));
          background: #fff;
          border: 1px solid #c9d0d8;
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(31, 41, 55, .18);
          padding: 14px 16px 12px;
          z-index: 3;
        }
        .stepPopHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }
        .stepCount { font-size: 11px; font-weight: 800; color: #3867a8; }
        .stepFrozen { font-size: 11px; font-weight: 700; color: ${C.amber}; }
        .stepRunning { font-size: 11px; font-weight: 700; color: ${C.muted}; }
        .stepPop h3 {
          margin: 0 0 6px;
          color: ${C.ink};
          font-size: 15px;
          line-height: 1.25;
        }
        .stepPop p {
          margin: 0 0 12px;
          font-size: 13.5px;
          line-height: 1.5;
          color: ${C.muted};
        }
        .stepPopFoot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .stepSkip {
          border: 0;
          background: transparent;
          color: ${C.muted};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 0;
        }
        .stepNext {
          border: 0;
          border-radius: 9px;
          padding: 8px 18px;
          font-size: 13.5px;
          font-weight: 800;
          color: #fff;
          background: #2166d1;
          cursor: pointer;
        }
        .stepNext:disabled { cursor: default; opacity: .6; }

        .controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 18px;
          border-top: 1px solid #e2e6ea;
          background: #fafbfc;
        }
        .controlGroup {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .actionBtn {
          border: 0;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          background: ${C.amber};
          cursor: pointer;
        }
        .actionBtn:disabled { cursor: default; opacity: .6; }

        .switchBtn {
          display: flex;
          align-items: center;
          gap: 11px;
          border: 0;
          background: transparent;
          color: ${C.ink};
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
          flex: 0 0 auto;
        }
        .toggle.on { background: #2d9b55; }
        .knob {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, .25);
          transition: .25s ease;
        }
        .toggle.on .knob { transform: translateX(24px); }

        .seg {
          display: inline-flex;
          padding: 3px;
          border-radius: 99px;
          background: #eef1f5;
          border: 1px solid #d9dee4;
        }
        .seg button {
          border: 0;
          border-radius: 99px;
          padding: 5px 12px;
          font-size: 13px;
          font-weight: 700;
          color: ${C.ink};
          background: transparent;
          cursor: pointer;
        }
        .seg button.on { background: #2166d1; color: #fff; }
        .seg button:disabled { cursor: default; opacity: .5; }

        .stepToggle {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 0;
          background: transparent;
          color: ${C.ink};
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 0;
        }
        .stepToggle:disabled { cursor: default; opacity: .5; }
        .stepToggleTrack {
          width: 38px;
          height: 22px;
          border-radius: 99px;
          padding: 3px;
          background: #c6ccd3;
          transition: background .2s ease;
          flex: 0 0 auto;
        }
        .stepToggle.on .stepToggleTrack { background: #2166d1; }
        .stepToggleKnob {
          display: block;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, .25);
          transition: transform .2s ease;
        }
        .stepToggle.on .stepToggleKnob { transform: translateX(16px); }

        .soundBtn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #d9dee4;
          border-radius: 99px;
          padding: 5px 12px;
          background: #fff;
          color: ${C.ink};
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .soundBtn.off { color: ${C.muted}; }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${C.muted};
          font-size: 14px;
          text-align: right;
        }
        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #a7afb8;
          flex: 0 0 auto;
        }
        .dot.on { background: #2d9b55; box-shadow: 0 0 0 4px #dff3e6; }

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
        .lessonBox h2 { margin: 0 0 7px; color: ${C.ink}; font-size: 15px; }
        .lessonBox p {
          margin: 0;
          color: ${C.muted};
          line-height: 1.5;
          font-size: 14px;
        }
        .onText { color: #19743b; font-weight: 800; }
        .offText { color: #9b5d13; font-weight: 800; }

        @media (max-width: 760px) {
          .page { padding: 10px; }
          .controls { align-items: flex-start; flex-direction: column; }
          .stepPop { left: 12px; right: 12px; width: auto; }
          .status { text-align: left; }
          .lesson { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="shell">
        <header className="heading">
          <div className="eyebrow">Electromagnetism • 03</div>
          <h1>Electromagnetic Bell</h1>
          <p className="intro">
            When current flows, the electromagnet pulls the iron armature and
            the hammer strikes the gong. That movement breaks the circuit, the
            springy strip pulls back, and the whole cycle repeats many times a
            second. Close the switch to ring the bell.
          </p>
        </header>

        <section className={"card" + (maximised ? " max" : "")} ref={cardRef}>
          <button
            className="maxBtn"
            onClick={toggleMaximise}
            aria-label={maximised ? "Exit full screen" : "Maximise the simulation"}
            title={maximised ? "Exit full screen (Esc)" : "Maximise"}
          >
            {maximised ? (
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M6 1v5H1M10 15v-5h5M15 6h-5V1M1 10h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M1 6V1h5M15 10v5h-5M10 1h5v5M6 15H1v-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          {onBack && (
            <div className="backRow">
              <button className="backButton" onClick={onBack}>
                ← Back
              </button>
            </div>
          )}

          <div className={"stage" + (guide && frozen ? " frozen" : "")}>
            <svg
              viewBox={PANEL_VIEWBOX}
              role="img"
              aria-label="Interactive electromagnetic bell diagram"
            >
              <style>{keyframes}</style>

              <Panel
                {...view}
                switchOn={switchOn}
                blur={fast && ringing && !reduceMotion}
                interactive={!guide}
                onToggleSwitch={toggleSwitch}
                reduceMotion={reduceMotion}
              />
            </svg>

            {guideStep && (
              <div className="stepPop" role="dialog" aria-live="polite">
                <div className="stepPopHead">
                  <span className="stepCount">
                    Step {guide.index + 1} of {RING_GUIDE.length}
                  </span>
                  {frozen ? (
                    <span className="stepFrozen">Time paused</span>
                  ) : (
                    <span className="stepRunning">Running…</span>
                  )}
                </div>
                <h3>{guideStep.title}</h3>
                <p>{guideStep.body}</p>
                <div className="stepPopFoot">
                  <button className="stepSkip" onClick={endGuide}>
                    Skip to end
                  </button>
                  <button className="stepNext" onClick={nextStep} disabled={!frozen}>
                    {lastStep ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="controls">
            <div className="controlGroup">
              {stepMode ? (
                <button className="actionBtn" onClick={startGuide} disabled={!!guide}>
                  Walk through one ring
                </button>
              ) : (
                <button className="switchBtn" onClick={toggleSwitch} aria-pressed={switchOn}>
                  <span className={"toggle " + (switchOn ? "on" : "")}>
                    <span className="knob" />
                  </span>
                  {switchOn ? "Switch closed" : "Switch open"}
                </button>
              )}

              <div className="seg" role="radiogroup" aria-label="Playback speed">
                <button
                  role="radio"
                  aria-checked={speed === "slow"}
                  className={speed === "slow" ? "on" : ""}
                  onClick={() => chooseSpeed("slow")}
                  disabled={!!guide}
                >
                  Slow motion
                </button>
                <button
                  role="radio"
                  aria-checked={speed === "fast"}
                  className={speed === "fast" ? "on" : ""}
                  onClick={() => chooseSpeed("fast")}
                  disabled={!!guide}
                >
                  Fast
                </button>
              </div>

              <button
                className={"stepToggle " + (stepMode ? "on" : "")}
                onClick={toggleStepMode}
                aria-pressed={stepMode}
                disabled={!!guide}
              >
                <span className="stepToggleTrack">
                  <span className="stepToggleKnob" />
                </span>
                Step-by-step
              </button>

              <button
                className={"soundBtn" + (soundOn ? "" : " off")}
                onClick={toggleSound}
                aria-pressed={soundOn}
                aria-label={soundOn ? "Sound on (click to mute)" : "Sound off (click to unmute)"}
              >
                <SpeakerIcon on={soundOn} />
                {soundOn ? "Sound on" : "Sound off"}
              </button>
            </div>

            <div className="status">
              <span className={"dot " + (currentOn || (fast && ringing && !guide) ? "on" : "")} />
              {status}
            </div>
          </div>
        </section>

        <section className="lesson">
          <div className="lessonBox">
            <h2>1. The electromagnet</h2>
            <p>
              {!switchOn ? (
                <>
                  The switch is open, so no current flows and the coil is
                  not magnetised.
                </>
              ) : fast && !guide ? (
                <>
                  The current switches on and off about {perSec} times a
                  second, so the electromagnet does too. That is too fast for
                  the eye to follow, so the current looks steady but dimmer.
                </>
              ) : view.contact ? (
                <>
                  Current flows through the coil, so it becomes an{" "}
                  <span className="onText">electromagnet</span> and attracts
                  the iron armature.
                </>
              ) : (
                <>
                  The contacts are apart, so no current flows and the
                  electromagnet is <span className="offText">off</span>.
                </>
              )}
            </p>
          </div>

          <div className="lessonBox">
            <h2>2. The hammer and the contacts</h2>
            <p>
              {!switchOn ? (
                <>
                  The springy strip holds the contacts together, ready to
                  complete the circuit as soon as the switch is closed.
                </>
              ) : fast && !guide ? (
                <>
                  Every swing hits the gong and breaks the circuit, and every
                  spring-back makes it again. Switch to slow motion to watch a
                  single swing.
                </>
              ) : view.contact ? (
                <>
                  The contacts are <span className="onText">touching</span>,
                  so the circuit is complete. The armature is pulled towards
                  the coil and the hammer swings towards the gong.
                </>
              ) : (
                <>
                  The moving strip has pulled the contacts{" "}
                  <span className="offText">apart</span>. The hammer hits the
                  gong, then the springy strip pulls everything back until the
                  contacts touch again.
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const keyframes = `
  @keyframes bellDash {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -24; }
  }

  .bell-flow {
    stroke-dasharray: 5 7;
    stroke-dashoffset: 0;
    animation: bellDash 1.2s linear infinite;
  }

  /* Current overlays fade with the current itself. The coil's own
     overlay (from solenoid.jsx) is recoloured to match the wires. */
  .bell-panel .bell-flow,
  .bell-panel .solenoid-current-flow {
    opacity: var(--bell-flow, 1);
  }
  .bell-panel .solenoid-current-flow {
    stroke: ${C.flow} !important;
  }

  @keyframes bellPulse {
    0% { opacity: .95; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.6, 1.9); }
  }

  .bell-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: bellPulse 1.1s ease-out infinite;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .bell-flow { animation: none; }
    .bell-pulse { animation: none; opacity: .9; }
  }
`;
