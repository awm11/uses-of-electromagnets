import React, { useEffect, useRef, useState } from "react";

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
  y: 150,
  w: 670,
  h: 400,
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

const FAN_MASK_STEPS = [16, 8, 0, -8, -16];

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

export default function ACCircuit({ onBack }) {
  const [sig, setSig] = useState("2");
  const [mode, setMode] = useState("changing");
  const [muted, setMuted] = useState(false);
  const [audioStarted, setAudioStarted] =
    useState(false);

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

  useEffect(() => {
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

      setAudioStarted(true);
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
  }, []);

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
        Math.abs(i) < 0.05
          ? "Current is momentarily zero"
          : i > 0
            ? "Current flows one way"
            : "Current flows the other way";

      if (dir !== lastDir) {
        dirRef.current.textContent =
          dir;

        lastDir = dir;
      }

      readoutRef.current.textContent =
        "i = " +
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 18px;
          border-top: 1px solid #e2e6ea;
          background: #fafbfc;
        }

        .readout {
          font-weight: 800;
          font-variant-numeric: tabular-nums;
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

        .audioHint {
          color: ${C.muted};
          font-size: 13px;
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
            <svg
              viewBox="0 0 1150 550"
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
                d="M130,377 V440 H372 V396 H424"
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
                d="M424,294 H372 V250 H130 V313"
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
                x="80"
                y="350"
                fontSize="18"
                fill={C.ink}
                textAnchor="end"
              >
                AC source
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
                        fillOpacity="0.4"
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
                Current is momentarily zero
              </text>
            </svg>
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
              {!audioStarted && (
                <span className="audioHint">
                  Click anywhere to enable
                  sound
                </span>
              )}

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
            <div
              className="readout"
              ref={readoutRef}
            >
              i = +0.00 A
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
        <ACCircuit />
      </div>
    </>
  );
}