import React, { useEffect, useRef, useState } from "react";
import Solenoid from "./solenoid.jsx";
import fieldImage from "./magneticFieldLines.png";
import fieldImageMirrored from "./fieldLinesMirrored.png";

/* ------------------------------------------------------------------
   Assets: ./solenoid.jsx, ./magneticFieldLines.png and
   ./fieldLinesMirrored.png

   These are imported statically, the same way the other pages do it,
   so the bundler resolves them at build time and rewrites them to the
   hashed files it emits.

   They used to be pulled in at runtime with import(/* @vite-ignore *\/ path)
   off a variable. That works on a dev server (which serves and compiles
   the source files on request) but silently fails in a production build:
   the bundler is told not to look at the import, so the files never make
   it into the output and the request 404s at runtime. The catch block
   then quietly swapped in the fallback coil and dropped the field lines.
   ------------------------------------------------------------------ */

const C = {
  ink: "#202020",
  casing: "#1a1a1a",
  amber: "#d97706",
  green: "#2d9b55",
  muted: "#59636f",
  // Dark grey for small or secondary text, in place of amber / faded grey
  grey: "#374151",
  copper: "#b86f32",
  metal: "#8f969d",
  metalDark: "#555c63",
  plastic: "#e4e7ea",
};

/* ------------------------------------------------------------------
   Animation steps. Each step is [delay in ms, state patch].
   ------------------------------------------------------------------ */

const NORMAL = {
  plungerUp: false, // plunger pushed down, contacts closed
  boltX: 0, // iron bolt displacement (SVG units)
  current: true, // normal current flowing through the circuit
  switchClosed: true, // contact bar touching both contacts
  surge: false,
};

// Surge: bolt is pulled out of the catch, the plunger springs up,
// the contacts open and the current stops. The bolt is then pushed
// back by its spring until it rests against the side of the plunger.
const SURGE_STEPS = [
  [0, { surge: true, boltX: -10 }],
  [500, { plungerUp: true, switchClosed: false }],
  [700, { current: false, surge: false }],
  [1200, { boltX: -5 }],
];
const SURGE_TOTAL = 1700;

// Reset: the plunger is pushed down and the bolt clicks into the catch.
const RESET_STEPS = [
  [0, { plungerUp: false }],
  [300, { switchClosed: true }], // contact bar lands on the contacts
  [500, { boltX: 0 }],
  [700, { current: true }],
];
const RESET_TOTAL = 1100;

/* ------------------------------------------------------------------
   Step-by-step mode: the surge, broken into moments. Each
   entry applies its patch, then time is frozen until the user clicks
   Next, so each moment can be looked at properly.
   ------------------------------------------------------------------ */

const SURGE_GUIDE = [
  {
    patch: { surge: true },
    title: "A current surge",
    body:
      "Something has gone wrong downstream: a fault, or too many appliances. The current climbs far above its normal value. Watch the ammeter and the trace.",
  },
  {
    patch: { boltX: -10 },
    title: "The electromagnet strengthens",
    body:
      "A bigger current through the coil means a stronger magnetic field. It is now strong enough to overcome the bolt's spring and pull the iron bolt out of the catch in the plunger.",
  },
  {
    patch: { plungerUp: true, switchClosed: false },
    title: "The plunger springs up",
    body:
      "Nothing is holding the plunger down any more, so its spring pushes it up. The contact bar lifts away from the contacts and the switch opens.",
  },
  {
    patch: { current: false, surge: false },
    title: "The current stops",
    body:
      "The circuit is broken, so no current reaches the house. With no current in the coil, the electromagnet switches off too.",
  },
  {
    patch: { boltX: -5 },
    title: "The bolt comes back",
    body:
      "With the electromagnet off, the bolt's spring pushes it back. It can only rest against the side of the plunger: the catch is now above it.",
  },
  {
    title: "Ready to reset",
    body:
      "The breaker stays off until someone pushes the reset button down, letting the bolt click back into the catch.",
  },
];

/* ------------------------------------------------------------------
   One panel of the diagram (drawn in a 280 x 210 coordinate space)
   ------------------------------------------------------------------ */

function Wire({ d, flowing, reverse }) {
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={C.ink}
        strokeWidth="1.8"
      />
      {flowing && (
        <path
          d={d}
          fill="none"
          stroke="#b7410e"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="cb-flow"
          style={reverse ? { animationDirection: "reverse" } : undefined}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------
   Helical springs (plunger spring and bolt spring)

   Each spring runs from a fixed anchor to a flange on a moving part. Its
   length follows that part, so the geometry is rebuilt every animation
   frame from the part's actual (animated) position. The coil count and
   wire thickness stay constant and only the pitch changes, as with a real
   spring. Strands at the back are drawn behind the part the spring wraps
   around, strands at the front over it.

   axis "v": runs up/down, anchored at y = anchor, extending in direction dir
   axis "h": runs left/right, anchored at x = anchor, extending in direction dir
   ------------------------------------------------------------------ */

const PLUNGER_SPRING = {
  axis: "v",
  anchor: 109, // top of the casing's lower edge
  dir: -1, // extends upwards
  center: 165, // x of the axis
  radius: 15.5,
  turns: 4,
  ry: 2.4, // how much each turn sags at the front (gives the helical look)
};
const PLUNGER_FLANGE_BOTTOM = 98; // underside of the plunger flange when down

const BOLT_SPRING = {
  axis: "h",
  anchor: 110, // inner face of the casing wall
  dir: 1, // extends towards the plunger
  center: 67, // y of the axis
  radius: 8.5,
  turns: 4,
  ry: 2.0,
};
const BOLT_FLANGE_X = 134; // left face of the bolt flange at rest

// Returns SVG path data for the strands at the front and at the back
function springGeometry(spec, length) {
  const { axis, anchor, dir, center, radius: R, turns: N, ry } = spec;
  const pitch = length / N;
  const point = (u) => {
    const along =
      anchor +
      dir * ((u + Math.PI / 2) / (2 * Math.PI)) * pitch +
      ry * Math.cos(u);
    const across = center + R * Math.sin(u);
    return axis === "v" ? [across, along] : [along, across];
  };
  const seg = (u0, u1) => {
    const steps = 8;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const [x, y] = point(u0 + ((u1 - u0) * i) / steps);
      d += `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return d;
  };

  let front = "";
  let back = "";
  for (let k = 0; k < N; k++) {
    const base = 2 * Math.PI * k;
    front += seg(-Math.PI / 2 + base, Math.PI / 2 + base);
    back += seg(Math.PI / 2 + base, (3 * Math.PI) / 2 + base);
  }
  return { front, back };
}

const PLUNGER_SPRING_REST = springGeometry(
  PLUNGER_SPRING,
  PLUNGER_SPRING.anchor - PLUNGER_FLANGE_BOTTOM
);
const BOLT_SPRING_REST = springGeometry(
  BOLT_SPRING,
  BOLT_FLANGE_X - BOLT_SPRING.anchor
);

// setRef(i) returns the ref callback for the i-th path of this layer
function SpringBack({ setRef, rest }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path ref={setRef(0)} d={rest.back} stroke="#374151" strokeWidth="3.4" />
      <path ref={setRef(1)} d={rest.back} stroke="#6b7280" strokeWidth="2.2" />
    </g>
  );
}

function SpringFront({ setRef, rest }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path ref={setRef(0)} d={rest.front} stroke="#374151" strokeWidth="3.6" />
      <path ref={setRef(1)} d={rest.front} stroke="#9ca3af" strokeWidth="2.4" />
      <path ref={setRef(2)} d={rest.front} stroke="#f3f4f6" strokeWidth="0.8" opacity="0.8" transform="translate(0 -0.7)" />
    </g>
  );
}

// Magnetic field overlay box. The CSS mirror (used only if there is no
// pre-flipped image) reflects about the image's own centre, so it is
// derived from these numbers rather than hard-coded.
const FIELD = { x: -14.5, y: 30.93, w: 118, h: 73.15 };
const FIELD_MIRROR = `translate(${2 * (FIELD.x + FIELD.w / 2)}px,0) scaleX(-1)`;

function Panel({
  plungerUp,
  boltX,
  current,
  surge,
  switchClosed,
  flowDir = 1, // 1 = forward, -1 = current direction reversed (AC)
  ac = false, // AC mode: terminals are live / neutral, not + / –
  interactive = false, // reset button can be clicked / dragged
  onReset,
  showLabels = true, // text labels/annotations (off for the compact preview)
}) {
  const gRef = useRef(null);
  const startRef = useRef(null);
  const [drag, setDrag] = useState(0); // 0..20 SVG units pushed down
  const [dragging, setDragging] = useState(false);

  const plungerShift = (plungerUp ? -20 : 0) + drag;
  const switchOn = switchClosed;

  // Faint field while current flows normally, stronger during a surge,
  // gone once the circuit has broken.
  const fieldOpacity = !current ? 0 : surge ? 0.72 : 0.26;

  // AC: the field reverses every half cycle (it follows flowDir, which
  // itself already flips on the signal's phase). Rather than snapping,
  // fade the image out, swap it for the mirrored one, then fade it in.
  const prevFlowDirRef = useRef(flowDir);
  const [fieldMirrored, setFieldMirrored] = useState(flowDir < 0);
  const [fieldPulsingOut, setFieldPulsingOut] = useState(false);

  useEffect(() => {
    if (!ac) {
      prevFlowDirRef.current = flowDir;
      setFieldMirrored(false);
      setFieldPulsingOut(false);
      return undefined;
    }
    if (flowDir === prevFlowDirRef.current) return undefined;
    prevFlowDirRef.current = flowDir;
    setFieldPulsingOut(true);
    const t = setTimeout(() => {
      setFieldMirrored(flowDir < 0);
      setFieldPulsingOut(false);
    }, 90);
    return () => clearTimeout(t);
  }, [flowDir, ac]);

  // The swap happens while the image is faded out, so the mirrored file
  // has to be in the cache by then or the first flip fades in to nothing.
  useEffect(() => {
    if (!fieldImageMirrored) return;
    const preload = new Image();
    preload.src = fieldImageMirrored;
  }, [fieldImageMirrored]);

  const plungerTransition = dragging
    ? "none"
    : "transform 0.6s cubic-bezier(.3,1.25,.5,1)";

  // Spring geometry is updated imperatively, once per frame, from the
  // animated positions of the plunger and the bolt (see springGeometry)
  const plungerRef = useRef(null);
  const boltRef = useRef(null);
  const springRefs = useRef({
    plungerBack: [],
    plungerFront: [],
    boltBack: [],
    boltFront: [],
  });
  const refSetter = (layer) => (i) => (node) => {
    springRefs.current[layer][i] = node;
  };

  useEffect(() => {
    let raf;
    let lastPlunger = null;
    let lastBolt = null;

    const readTransform = (el) => {
      if (!el) return null;
      const t = getComputedStyle(el).transform;
      return t && t !== "none" ? new DOMMatrix(t) : null;
    };

    const apply = (layers, g) => {
      layers.back.forEach((n) => n && n.setAttribute("d", g.back));
      layers.front.forEach((n) => n && n.setAttribute("d", g.front));
    };

    const tick = () => {
      const refs = springRefs.current;

      const pm = readTransform(plungerRef.current);
      const plungerLength = Math.max(
        4,
        PLUNGER_SPRING.anchor - (PLUNGER_FLANGE_BOTTOM + (pm ? pm.m42 : 0))
      );
      if (plungerLength !== lastPlunger) {
        lastPlunger = plungerLength;
        apply(
          { back: refs.plungerBack, front: refs.plungerFront },
          springGeometry(PLUNGER_SPRING, plungerLength)
        );
      }

      const bm = readTransform(boltRef.current);
      const boltLength = Math.max(
        4,
        BOLT_FLANGE_X + (bm ? bm.m41 : 0) - BOLT_SPRING.anchor
      );
      if (boltLength !== lastBolt) {
        lastBolt = boltLength;
        apply(
          { back: refs.boltBack, front: refs.boltFront },
          springGeometry(BOLT_SPRING, boltLength)
        );
      }

      raf = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handlePointerDown = (e) => {
    if (!interactive) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { y: e.clientY, moved: false };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    const st = startRef.current;
    if (!st || !gRef.current) return;
    const ctm = gRef.current.getScreenCTM();
    const scale = ctm ? ctm.d : 1;
    const dy = (e.clientY - st.y) / scale;
    if (Math.abs(dy) > 2) st.moved = true;
    setDrag(Math.max(0, Math.min(20, dy)));
  };

  const handlePointerUp = () => {
    const st = startRef.current;
    if (!st) return;
    startRef.current = null;
    setDragging(false);
    const pushed = drag;
    setDrag(0);
    // A plain click, or a drag past halfway, resets the breaker.
    if (!st.moved || pushed > 10) onReset && onReset();
  };

  const handlePointerCancel = () => {
    startRef.current = null;
    setDragging(false);
    setDrag(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onReset && onReset();
    }
  };

  return (
    <g ref={gRef} transform="translate(0 22)">
      <defs>
        <linearGradient id="cbBoltGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="18%" stopColor="#9ca3af" />
          <stop offset="42%" stopColor="#d1d5db" />
          <stop offset="58%" stopColor="#9ca3af" />
          <stop offset="82%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>

        {/* Subtle left-to-right shading so the plunger reads as a cylinder */}
        <linearGradient id="cbPlungerGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d9cfb4" />
          <stop offset="28%" stopColor="#fbf5e3" />
          <stop offset="55%" stopColor="#efe6cc" />
          <stop offset="100%" stopColor="#c9bd9b" />
        </linearGradient>

        <linearGradient id="cbBoltEndGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="45%" stopColor="#9ca3af" />
          <stop offset="55%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
      </defs>

      {/* Wires */}
      <Wire d="M-5,35.5 V22 H56 V44.35" flowing={current} reverse={flowDir < 0} />
      <Wire d="M23.5,44.35 H5 V143 H140" flowing={current} reverse={flowDir < 0} />
      <Wire d="M190,143 H245" flowing={current} reverse={flowDir < 0} />
      {/* Return wire to the negative terminal: current flows into it, so
          its dash direction is the opposite of the other three wires */}
      <Wire d="M-5,86.5 V182 H255" flowing={current} reverse={flowDir > 0} />

      {/* Contacts */}
      <circle cx="140" cy="143" r="3.5" fill={C.ink} />
      <circle cx="190" cy="143" r="3.5" fill={C.ink} />

      {/* Supply terminals: + / – for DC, live / neutral for AC */}
      <circle cx="-5" cy="40" r="4.5" fill="#fff" stroke={C.ink} strokeWidth="1.3" />
      <circle cx="-5" cy="82" r="4.5" fill="#fff" stroke={C.ink} strokeWidth="1.3" />

      <g
        style={{ opacity: ac ? 0 : 1, transition: "opacity 0.3s ease" }}
        stroke={C.ink}
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <line x1="-7.4" y1="40" x2="-2.6" y2="40" />
        <line x1="-5" y1="37.6" x2="-5" y2="42.4" />
        <line x1="-7.4" y1="82" x2="-2.6" y2="82" />
      </g>

      {showLabels && (
        <g
          style={{ opacity: ac ? 1 : 0, transition: "opacity 0.3s ease" }}
          fontSize="6.5"
          fill={C.grey}
          textAnchor="end"
          dominantBaseline="central"
          aria-hidden={!ac}
        >
          <text x="-12" y="40">live</text>
          <text x="-12" y="82">neutral</text>
        </g>
      )}

      {/* Electromagnet (solenoid on the left, 7 turns) */}
      <Solenoid
        on={current}
        reverse={flowDir > 0}
        corner={{ x: 76, y: 67 }}
        orientation={0}
        mirror={true}
        scale={0.3}
        turns={7}
      />

      {/* Magnetic field lines (only if a field image was passed in) */}
      {fieldImage && (
        <image
          href={fieldMirrored && fieldImageMirrored ? fieldImageMirrored : fieldImage}
          x={FIELD.x}
          y={FIELD.y}
          width={FIELD.w}
          height={FIELD.h}
          preserveAspectRatio="none"
          style={{
            opacity: fieldPulsingOut ? 0 : fieldOpacity,
            // Only mirror in CSS when there's no pre-flipped image to swap in
            transform:
              fieldMirrored && !fieldImageMirrored ? FIELD_MIRROR : "none",
            transition: fieldPulsingOut
              ? "opacity 0.09s ease-out"
              : surge
              ? "opacity 0.12s ease-out"
              : "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        />
      )}

      

      {/* External casing (solid black) */}
      <g fill={C.casing}>
        <rect x="104" y="40" width="6" height="19" />
        <rect x="104" y="75" width="6" height="41" />
        <rect x="104" y="40" width="47" height="6" />
        {/* Chimney: the tube the reset button passes through */}
        <rect x="146" y="21" width="5" height="25" />
        <rect x="179" y="21" width="5" height="25" />
        {/* Inward-facing tabs at the top of the chimney */}
        <rect x="146" y="21" width="9" height="4" />
        <rect x="175" y="21" width="9" height="4" />
        <rect x="179" y="40" width="17" height="6" />
        <rect x="190" y="40" width="6" height="76" />
        <rect x="104" y="110" width="52.5" height="6" />
        <rect x="173.5" y="110" width="22.5" height="6" />
      </g>

      {/* Plunger spring: strands at the back (hidden behind the plunger body) */}
      <SpringBack setRef={refSetter("plungerBack")} rest={PLUNGER_SPRING_REST} />

      {/* Plastic plunger, reset button and contact bar */}
      <g
        ref={plungerRef}
        style={{
          transform: `translateY(${plungerShift}px)`,
          transition: plungerTransition,
        }}
      >
        {/* Thin upper column: bottom stays buried in the body at y=50 */}
        <rect x="159" y="10" width="12" height="40" fill="url(#cbPlungerGradient)" stroke={C.ink} strokeWidth="1.2" />
        <rect
          x="157"
          y="8"
          width="16"
          height="5"
          rx="1"
          fill="#aeb4bb"
          stroke={C.ink}
          strokeWidth="1.2"
          className={interactive ? "cb-capflash" : undefined}
        />
        {/* Flange the spring pushes against */}
        <rect x="147" y="94" width="36" height="4" rx="1.2" fill="url(#cbPlungerGradient)" stroke="#3a3f45" strokeWidth="1.3" />
        <path
          d="M152,45 H178 V106 L170,118 V135 H160 V118 L152,106 V72 H158 V62 H152 Z"
          fill="url(#cbPlungerGradient)"
          stroke="#3a3f45"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <rect x="140" y="135" width="50" height="5" fill={C.copper} stroke={C.ink} strokeWidth="1" />

        {interactive && (
          <>
            <rect
              className="cb-pulse"
              x="155"
              y="6"
              width="20"
              height="9"
              rx="2"
              fill="none"
              stroke={C.amber}
              strokeWidth="1.6"
            />
            {/* Invisible hit area over the reset button */}
            <rect
              x="148"
              y="0"
              width="34"
              height="36"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label="Reset button: click, press Enter, or drag down to reset the breaker"
              style={{
                cursor: dragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onKeyDown={handleKeyDown}
            />
          </>
        )}
      </g>

      {/* Plunger spring: strands at the front (over the plunger body) */}
      <SpringFront setRef={refSetter("plungerFront")} rest={PLUNGER_SPRING_REST} />

      {/* Bolt spring: strands at the back (hidden behind the bolt) */}
      <SpringBack setRef={refSetter("boltBack")} rest={BOLT_SPRING_REST} />

      {/* Iron bolt */}
      <g
        ref={boltRef}
        style={{
          transform: `translateX(${boltX}px)`,
          transition: "transform 0.5s cubic-bezier(.34,1.3,.4,1)",
        }}
      >
        {/* Bolt: uniform 12-unit-thick bar, narrowing to a tip near the catch */}
        <path
          d="M88,61 H146 L150,64 H157 V70 H150 L146,73 H88 Q86,73 86,71 V63 Q86,61 88,61 Z"
          fill="url(#cbBoltGradient)"
          stroke="#374151"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <rect x="88" y="62.2" width="57" height="1.5" rx="0.75" fill="#ffffff" opacity="0.28" />
        <rect x="88" y="70.4" width="57" height="1.2" fill="#1f2937" opacity="0.3" />

        {/* Flange the bolt spring pushes against */}
        <rect x={BOLT_FLANGE_X} y="56" width="4" height="22" rx="1.2" fill="url(#cbBoltGradient)" stroke="#374151" strokeWidth="0.9" />
      </g>

      {/* Bolt spring: strands at the front (over the bolt) */}
      <SpringFront setRef={refSetter("boltFront")} rest={BOLT_SPRING_REST} />

      {showLabels && (
        <>
          {/* Labels */}
          <g fontSize="10.5" fill={C.ink}>
            <text x="190" y="10">Reset button</text>
            <text x="84" y="30">Spring</text>
            <line x1="100" y1="33" x2="116" y2="60" stroke={C.ink} strokeWidth="0.8" />

            <text x="202" y="52">Plastic</text>
            <text x="202" y="63">plunger</text>
            <line x1="199" y1="50" x2="166" y2="50" stroke={C.ink} strokeWidth="0.8" />

            <text x="202" y="108">Spring</text>
            <line x1="199" y1="104" x2="178" y2="104" stroke={C.ink} strokeWidth="0.8" />

            <text x="24" y="92">Electro-</text>
            <text x="24" y="103">magnet</text>

            <text x="99" y="118" textAnchor="end">Iron bolt</text>
            <line x1="88" y1="108" x2="90" y2="68" stroke={C.ink} strokeWidth="0.8" />

            <text x="165" y="164" textAnchor="middle">
              Switch is {switchOn ? "ON" : "OFF"}
            </text>

            {/* "To house circuit" label + arrow: nudge as one block */}
            <g transform="translate(0 5)">
              <text x="219" y="156">To house</text>
              <text x="219" y="167">circuit</text>
              <line x1="255" y1="163.5" x2="264" y2="163.5" stroke={C.ink} strokeWidth="1.8" />
              <polygon points="270,163.5 262,159.5 262,167.5" fill={C.ink} />
            </g>
          </g>

          {surge && (
            <text x="20" y="12" fontSize="12" fontWeight="700" fill={C.amber}>
              Current surge!
            </text>
          )}
        </>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------
   Small shared UI pieces for the instrument panels
   ------------------------------------------------------------------ */

const onActivate = (fn) => (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

function MinimiseButton({ cx, cy, onClick, label }) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onActivate(onClick)}
      style={{ cursor: "pointer" }}
    >
      <circle cx={cx} cy={cy} r="8" fill="#eef1f5" stroke="#b8c0c8" />
      <line x1={cx - 3.5} y1={cy} x2={cx + 3.5} y2={cy} stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

function CollapsedBar({ label, onExpand, width = 170 }) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Show ${label}`}
      onClick={onExpand}
      onKeyDown={onActivate(onExpand)}
      style={{ cursor: "pointer" }}
    >
      <rect x="0" y="0" width={width} height="26" rx="13" fill="#fff" stroke="#d9dee4" />
      <circle cx="13" cy="13" r="8" fill="#eef1f5" stroke="#b8c0c8" />
      <line x1="9.5" y1="13" x2="16.5" y2="13" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="13" y1="9.5" x2="13" y2="16.5" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" />
      <text x="28" y="13.5" fontSize="11" fontWeight="700" dominantBaseline="central" fill={C.ink}>
        {label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------
   Current signal shared by the ammeter, the time series and the
   current-flow animation.

   The circuit is shown in 50x slow motion: 1 s of real time = 20 ms of
   circuit time. A sample is taken every 20 ms of real time and
   advances the circuit clock by 0.4 ms, so one 50 Hz mains cycle
   (20 ms) takes 1 s on screen.

   Pausing only freezes the displayed trace; the circuit keeps running.
   ------------------------------------------------------------------ */

const CH = {
  w: 280,
  h: 170,
  px: 40, // plot area
  py: 26,
  pw: 230,
  ph: 108,
  window: 40, // ms of circuit time shown
  dt: 0.4, // ms of circuit time per sample (taken every 20 ms of real time)
  maxA: 60,
  freq: 0.05, // cycles per ms (50 Hz)
};

function useCurrentSignal(mode, ac, paused, frozen) {
  const [sig, setSig] = useState({ pts: [], value: 0, flowDir: 1 });

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const acRef = useRef(ac);
  acRef.current = ac;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;

  useEffect(() => {
    const sim = { t: 0, amp: 0, dir: 1, i: 0 };
    const buf = [];
    let shown = [];

    const step = () => {
      const m = modeRef.current;
      const isAc = acRef.current;
      // Amplitudes: steady reading (DC), or rms x sqrt(2) peak (AC).
      // The AC surge is 40 A rms so its ~57 A peak stays inside the
      // chart's 60 A scale instead of clipping against the frame.
      const base =
        m === "surge" ? (isAc ? 40 : 48) : m === "low" ? 6 : 0;
      const target = isAc ? base * Math.SQRT2 : base;
      sim.amp += (target - sim.amp) * 0.2;
      sim.t += CH.dt;

      const phase = Math.sin(2 * Math.PI * CH.freq * sim.t);
      sim.i = isAc
        ? sim.amp * phase
        : sim.amp + (sim.amp > 0.5 ? (Math.random() - 0.5) * 1.0 : 0);
      sim.dir = isAc && phase < 0 ? -1 : 1;
      buf.push({ t: sim.t, i: sim.i });
    };

    // Pre-fill so a full trace is visible straight away
    for (let k = 0; k < CH.window / CH.dt + 5; k++) step();
    shown = buf.slice();
    setSig({ pts: shown, value: sim.i, flowDir: sim.dir });

    const id = setInterval(() => {
      // Frozen: step-by-step mode has stopped the clock entirely, so the
      // trace, the needle and the flow animation all hold where they are
      if (frozenRef.current) return;
      step();
      while (buf.length && buf[0].t < sim.t - CH.window) buf.shift();
      if (!pausedRef.current) shown = buf.slice();
      setSig({ pts: shown, value: sim.i, flowDir: sim.dir });
    }, 20);

    return () => clearInterval(id);
  }, []);

  return sig;
}

/* ------------------------------------------------------------------
   Analogue ammeter (drawn in a 200 x 170 coordinate space)

   DC: scale 0 to 50 A, zero at the left, steady reading.
   AC: centre-zero scale -80 to +80 A, the needle follows the
       instantaneous current (slowed down 50x so you can see it swing).
   mode: "low" = small current, "surge" = off-scale flick, "off" = none
   ------------------------------------------------------------------ */

const AM = { cx: 100, cy: 140, sweep: 50 }; // sweep = degrees each side of vertical
const AM_DC_MAX = 50;
const AM_AC_MAX = 80;

const ammeterAngle = (v, ac) =>
  ac
    ? (AM.sweep * v) / AM_AC_MAX
    : -AM.sweep + (2 * AM.sweep * v) / AM_DC_MAX;

const ammeterPoint = (v, r, ac) => {
  const a = (ammeterAngle(v, ac) * Math.PI) / 180;
  return { x: AM.cx + r * Math.sin(a), y: AM.cy - r * Math.cos(a) };
};

function Ammeter({ mode, ac, value = 0, onMinimise }) {
  const [jitter, setJitter] = useState(0);

  // Small wandering of the needle while a low DC current flows
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (mode !== "low" || ac || reduce) {
      setJitter(0);
      return undefined;
    }

    const id = setInterval(() => setJitter((Math.random() - 0.5) * 2.4), 380);
    return () => clearInterval(id);
  }, [mode, ac]);

  const reading = ac
    ? Math.max(-AM_AC_MAX, Math.min(AM_AC_MAX, value))
    : mode === "surge"
    ? 48
    : mode === "low"
    ? 6 + jitter
    : 0;
  const angle = ammeterAngle(reading, ac);

  const needleTransition = ac
    ? "transform 0.04s linear" // follows the live signal
    : mode === "surge"
    ? "transform 0.14s cubic-bezier(.2,1.8,.5,1)" // quick flick with a little overshoot
    : mode === "low"
    ? "transform 0.4s ease-out"
    : "transform 0.8s ease-out";

  // Ticks and labels
  const ticks = [];
  const tickValues = [];
  if (ac) {
    for (let v = -AM_AC_MAX; v <= AM_AC_MAX; v += 10) tickValues.push(v);
  } else {
    for (let v = 0; v <= AM_DC_MAX + 0.01; v += 2.5) tickValues.push(v);
  }

  tickValues.forEach((v) => {
    const major = ac ? v % 40 === 0 : v % 10 === 0;
    const medium = ac ? v % 20 === 0 : v % 5 === 0;
    const p1 = ammeterPoint(v, 92, ac);
    const p2 = ammeterPoint(v, major ? 82 : medium ? 85 : 88, ac);
    ticks.push(
      <line
        key={v}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={C.ink}
        strokeWidth={major ? 1.8 : 1}
      />
    );
  });

  const labelValues = ac ? [-80, -40, 0, 40, 80] : [0, 10, 20, 30, 40, 50];
  const labels = labelValues.map((v) => {
    const p = ammeterPoint(v, 68, ac);
    return (
      <text
        key={v}
        x={p.x}
        y={p.y}
        fontSize="11"
        textAnchor="middle"
        dominantBaseline="central"
        fill={C.ink}
      >
        {v < 0 ? `−${-v}` : v}
      </text>
    );
  });

  // Danger zones
  const arc = (v1, v2) => {
    const a = ammeterPoint(v1, 95, ac);
    const b = ammeterPoint(v2, 95, ac);
    return `M${a.x},${a.y} A95,95 0 0 1 ${b.x},${b.y}`;
  };
  const dangerPaths = ac
    ? [arc(35, 80), arc(-80, -35)]
    : [arc(25, 50)];

  return (
    <g role="img" aria-label="Analogue ammeter">
      {/* Housing and dial face */}
      <rect x="0" y="0" width="200" height="170" rx="14" fill="#2b2f33" />
      <rect x="9" y="9" width="182" height="152" rx="8" fill="#f4f1e8" />

      {dangerPaths.map((d) => (
        <path key={d} d={d} fill="none" stroke="#c2410c" strokeWidth="4" />
      ))}

      {ticks}
      {labels}

      <text x="182" y="26" fontSize="10" fontWeight="700" textAnchor="end" fill={C.muted}>
        {ac ? "AC" : "DC"}
      </text>
      <text x="100" y="104" fontSize="22" fontWeight="700" textAnchor="middle" fill={C.ink}>
        A
      </text>
      <text x="100" y="156" fontSize="9" textAnchor="middle" fill={C.muted}>
        {ac ? "AMPS (instantaneous)" : "AMPS"}
      </text>

      {/* Needle */}
      <g
        style={{
          transformOrigin: `${AM.cx}px ${AM.cy}px`,
          transform: `rotate(${angle}deg)`,
          transition: needleTransition,
        }}
      >
        <line
          x1={AM.cx}
          y1={AM.cy + 12}
          x2={AM.cx}
          y2={AM.cy - 88}
          stroke="#b91c1c"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <circle cx={AM.cx} cy={AM.cy} r="6.5" fill="#2b2f33" />

      {onMinimise && (
        <MinimiseButton cx={26} cy={24} onClick={onMinimise} label="Hide ammeter" />
      )}
    </g>
  );
}

/* ------------------------------------------------------------------
   Current time series (drawn in a 280 x 170 coordinate space)

   Shows the circuit current over the last 40 ms, as direct current
   (default) or as 50 Hz alternating current.
   ------------------------------------------------------------------ */

function CurrentChart({
  pts,
  paused,
  onTogglePause,
  ac,
  onToggleAc,
  onMinimise,
}) {
  const last = pts.length ? pts[pts.length - 1].t : 0;
  const yMid = CH.py + CH.ph / 2;
  const xOf = (t) => CH.px + ((t - (last - CH.window)) / CH.window) * CH.pw;
  const yOf = (i) => yMid - (i / CH.maxA) * (CH.ph / 2);

  const path = pts
    .map(
      (p, k) =>
        `${k ? "L" : "M"}${xOf(p.t).toFixed(1)},${yOf(p.i).toFixed(1)}`
    )
    .join(" ");

  return (
    <g role="img" aria-label="Time series of the circuit current">
      <rect x="0" y="0" width={CH.w} height={CH.h} rx="10" fill="#fff" stroke="#d9dee4" />

      {onMinimise && (
        <MinimiseButton cx={17} cy={14} onClick={onMinimise} label="Hide time series" />
      )}
      <text x="30" y="17" fontSize="11" fontWeight="700" fill={C.ink}>
        Current (A)
      </text>

      <clipPath id="cbChartClip">
        <rect x={CH.px} y={CH.py} width={CH.pw} height={CH.ph} />
      </clipPath>

      {/* Horizontal grid + y labels */}
      {[-60, -30, 0, 30, 60].map((v) => (
        <g key={v}>
          <line
            x1={CH.px}
            x2={CH.px + CH.pw}
            y1={yOf(v)}
            y2={yOf(v)}
            stroke={v === 0 ? "#9aa3ad" : "#e5e8ec"}
            strokeWidth={v === 0 ? 1 : 0.8}
          />
          <text x={CH.px - 5} y={yOf(v)} fontSize="8" textAnchor="end" dominantBaseline="central" fill={C.muted}>
            {v}
          </text>
        </g>
      ))}

      {/* Vertical grid + x labels (time before now, ms) */}
      {[0, 1, 2, 3, 4].map((k) => {
        const x = CH.px + (CH.pw * k) / 4;
        return (
          <g key={k}>
            <line x1={x} x2={x} y1={CH.py} y2={CH.py + CH.ph} stroke="#e5e8ec" strokeWidth="0.8" />
            <text x={x} y={CH.py + CH.ph + 11} fontSize="8" textAnchor="middle" fill={C.muted}>
              {k === 4 ? "0" : `−${(4 - k) * 10}`}
            </text>
          </g>
        );
      })}

      <rect x={CH.px} y={CH.py} width={CH.pw} height={CH.ph} fill="none" stroke="#b8c0c8" strokeWidth="1" />

      <g clipPath="url(#cbChartClip)">
        <path d={path} fill="none" stroke="#2166d1" strokeWidth="1.6" strokeLinejoin="round" />
      </g>

      <text x={CH.px + CH.pw / 2} y={CH.h - 7} fontSize="8.5" textAnchor="middle" fill={C.muted}>
        Time before now (ms) • slow motion ×50
      </text>

      {paused && (
        <text x={CH.px + CH.pw - 6} y={CH.py + 12} fontSize="9" fontWeight="700" textAnchor="end" fill={C.amber}>
          PAUSED
        </text>
      )}

      {/* DC / AC toggle */}
      <g
        role="switch"
        tabIndex={0}
        aria-checked={ac}
        aria-label="Alternating current (50 Hz)"
        onClick={onToggleAc}
        onKeyDown={onActivate(onToggleAc)}
        style={{ cursor: "pointer" }}
      >
        <rect x="118" y="5" width="74" height="18" rx="9" fill="#eef1f5" stroke="#b8c0c8" />
        <rect
          x={ac ? 155 : 119}
          y="6"
          width="36"
          height="16"
          rx="8"
          fill="#2166d1"
          style={{ transition: "x 0.2s ease" }}
        />
        <text x="137" y="14.5" fontSize="9" fontWeight="700" textAnchor="middle" dominantBaseline="central" fill={ac ? C.ink : "#fff"}>
          DC
        </text>
        <text x="173" y="14.5" fontSize="9" fontWeight="700" textAnchor="middle" dominantBaseline="central" fill={ac ? "#fff" : C.ink}>
          AC
        </text>
      </g>

      {/* Pause / resume button */}
      <g
        role="button"
        tabIndex={0}
        aria-label={paused ? "Resume time series" : "Pause time series"}
        aria-pressed={paused}
        onClick={onTogglePause}
        onKeyDown={onActivate(onTogglePause)}
        style={{ cursor: "pointer" }}
      >
        <rect x={CH.w - 84} y="5" width="74" height="18" rx="9" fill={paused ? "#eaf7ef" : "#eef1f5"} stroke="#b8c0c8" />
        {paused ? (
          <polygon points={`${CH.w - 76},10 ${CH.w - 76},18 ${CH.w - 69},14`} fill={C.ink} />
        ) : (
          <>
            <rect x={CH.w - 76} y="10" width="2.6" height="8" fill={C.ink} />
            <rect x={CH.w - 71} y="10" width="2.6" height="8" fill={C.ink} />
          </>
        )}
        <text x={CH.w - 42} y="14.2" fontSize="8.5" fontWeight="700" textAnchor="middle" dominantBaseline="central" fill={C.ink}>
          {paused ? "Resume" : "Pause"}
        </text>
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------
   Compact looping preview (same pattern as DoorLockPreview).
   Shows only the animated breaker circuit: no ammeter, no time series.
   ------------------------------------------------------------------ */

export function CircuitBreakerPreview() {
  const [s, setS] = useState(NORMAL);

  useEffect(() => {
    let timers = [];

    const clearTimers = () => {
      timers.forEach((t) => clearTimeout(t));
      timers = [];
    };

    const at = (delay, patch) => {
      timers.push(setTimeout(() => setS((p) => ({ ...p, ...patch })), delay));
    };

    const run = () => {
      clearTimers();
      setS(NORMAL);
      SURGE_STEPS.forEach(([d, p]) => at(2500 + d, p));
      RESET_STEPS.forEach(([d, p]) => at(6500 + d, p));
    };

    run();
    const interval = setInterval(run, 9500);

    return () => {
      clearTimers();
      clearInterval(interval);
    };
  }, []);

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
        viewBox="-12 0 292 210"
        style={{ display: "block", width: "100%", height: "100%" }}
        role="img"
        aria-label="Circuit breaker preview"
      >
        <Panel {...s} showLabels={false} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------
   Full interactive page
   ------------------------------------------------------------------ */

export default function CircuitBreaker({ onBack }) {
  const [s, setS] = useState(NORMAL);
  const [animating, setAnimating] = useState(false);
  const [ac, setAc] = useState(false);
  const [paused, setPaused] = useState(false);
  const [maximised, setMaximised] = useState(false);
  const cardRef = useRef(null);
  const [showChart, setShowChart] = useState(true);
  const [showAmmeter, setShowAmmeter] = useState(true);
  const [stepMode, setStepMode] = useState(false);
  const [guide, setGuide] = useState(null); // {steps, index} while stepping
  const [frozen, setFrozen] = useState(false);
  const guideRef = useRef(null);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  // Maximise: use real full screen where the browser allows it, and a
  // CSS full-window overlay otherwise. Esc leaves either.
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

  // Let each moment render (the trace, the needle, the mechanism) and
  // then stop the clock, so the step can be looked at properly. Each
  // step's settle window is a share of the guide's total real-world
  // duration (the same duration the un-guided animation takes), so the
  // whole walkthrough advances the time series by the same amount as
  // watching the surge or the reset happen normally, however many
  // steps it's broken into.
  useEffect(() => {
    if (!guide) {
      setFrozen(false);
      return undefined;
    }
    setFrozen(false);
    const settleMs = guide.total / guide.steps.length;
    const t = setTimeout(() => setFrozen(true), settleMs);
    return () => clearTimeout(t);
  }, [guide]);

  guideRef.current = guide;

  const applyPatch = (patch) => {
    if (patch) setS((p) => ({ ...p, ...patch }));
  };

  const startGuide = (steps, total) => {
    clearTimers();
    setAnimating(false);
    setGuide({ steps, total, index: 0 });
    applyPatch(steps[0].patch);
  };

  const nextStep = () => {
    if (!guide) return;
    const i = guide.index + 1;
    if (i >= guide.steps.length) {
      setGuide(null);
      return;
    }
    applyPatch(guide.steps[i].patch);
    setGuide({ ...guide, index: i });
  };

  const endGuide = () => {
    if (!guide) return;
    // Apply whatever is left so the mechanism ends in a consistent state
    guide.steps.slice(guide.index + 1).forEach((st) => applyPatch(st.patch));
    setGuide(null);
  };

  const play = (steps, total) => {
    clearTimers();
    setAnimating(true);

    timersRef.current = steps.map(([delay, patch]) =>
      setTimeout(() => setS((p) => ({ ...p, ...patch })), delay)
    );

    timersRef.current.push(
      setTimeout(() => {
        setAnimating(false);
        timersRef.current = [];
      }, total)
    );
  };

  const tripped = s.plungerUp;

  // The final moment of the surge walkthrough leaves the plunger up and
  // waiting to be lowered, just like the ordinary (non-guided) tripped
  // state, so the reset button pulses and is clickable/draggable there too
  const inSurgeFinalStep =
    !!guide && guide.steps === SURGE_GUIDE && guide.index === guide.steps.length - 1;

  const waitingForReset =
    tripped && !animating && (!guide || inSurgeFinalStep);

  const mode = s.surge ? "surge" : s.current ? "low" : "off";
  const sig = useCurrentSignal(mode, ac, paused, frozen);

  // Left-hand column layout: instruments stack from the top
  const chartY = 15;
  const chartH = showChart ? CH.h : 26;
  const ammY = chartY + chartH + 16;

  const handleSurge = () => {
    if (animating || tripped || guide) return;
    if (stepMode) startGuide(SURGE_GUIDE, SURGE_TOTAL);
    else play(SURGE_STEPS, SURGE_TOTAL);
  };

  // Pressing the reset button only ever lowers the plunger. Step-by-step
  // mode is started by "Walk through a surge" and nothing else.
  const handleReset = () => {
    if (animating || !tripped) return;
    if (guide && !inSurgeFinalStep) {
      // Mid-walkthrough: the mechanism is driven by Next, not by clicks
      return;
    }
    play(RESET_STEPS, RESET_TOTAL);
  };

  return (
    <main className="page">
      <style>{`
        * { box-sizing: border-box; }
        /* A click never leaves a ring behind; keyboard focus always shows
           one. :focus-visible only matches when focus arrived from the
           keyboard, so pointer users see nothing. */
        button, [role="button"], [role="switch"] {
          outline: none;
        }
        button::-moz-focus-inner { border: 0; }
        button:focus-visible,
        [role="button"]:focus-visible,
        [role="switch"]:focus-visible {
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
          /* set explicitly: an inherited colour loses to any h1 rule
             in the surrounding app's stylesheet */
          color: ${C.ink};
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.1;
          letter-spacing: -.04em;
        }
        .intro {
          max-width: 780px;
          /* auto side margins centre the block, text-align centres the
             lines inside it */
          margin: 8px auto 0;
          text-align: center;
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
        .card { position: relative; }
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
        .backButton:disabled { cursor: default; opacity: .55; }
        .stage { padding: 12px; position: relative; }

        /* Step-by-step: the clock is stopped, so stop the flow dashes too */
        .stage.frozen .cb-flow,
        .stage.frozen .solenoid-current-flow {
          animation-play-state: paused;
        }

        .stepPop {
          position: absolute;
          left: 16px;
          bottom: 16px;
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
        .stepCount {
          font-size: 11px;
          font-weight: 800;
          color: #3867a8;
        }
        .stepFrozen {
          font-size: 11px;
          font-weight: 700;
          color: ${C.amber};
        }
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
        .stepLower {
          border: 1px solid #2166d1;
          border-radius: 9px;
          padding: 7px 16px;
          font-size: 13.5px;
          font-weight: 800;
          color: #2166d1;
          background: #fff;
          cursor: pointer;
        }
        .stepLower:disabled {
          cursor: default;
          opacity: .55;
          border-color: #b8c0c8;
          color: ${C.muted};
        }
        

        .controlGroup {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
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
        .stage svg { display: block; width: 100%; max-width: 1050px; height: auto; margin: 0 auto; }

        .panelTitles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 0 18px 10px;
          font-size: 13px;
          font-weight: 700;
          color: ${C.muted};
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
          <div className="eyebrow">Electromagnetism • 02</div>
          <h1>Circuit Breaker</h1>
          <p className="intro">
            A current surge makes the electromagnet strong enough to pull
            the iron bolt out of the plunger, cutting off the current.
            Cause a surge, then reset the breaker.
          </p>
        </header>

        <section
          className={"card" + (maximised ? " max" : "")}
          ref={cardRef}
        >
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
              <button className="backButton" onClick={onBack} disabled={animating}>
                ← Back
              </button>
            </div>
          )}

          <div className={"stage" + (frozen ? " frozen" : "")}>
            <svg
              viewBox="4 -15 857 422"
              role="img"
              aria-label="Interactive circuit breaker diagram with an ammeter"
            >
              <style>{keyframes}</style>

              <g transform={`translate(10 ${chartY})`}>
                {showChart ? (
                  <CurrentChart
                    pts={sig.pts}
                    paused={paused}
                    onTogglePause={() => setPaused((v) => !v)}
                    ac={ac}
                    onToggleAc={() => setAc((v) => !v)}
                    onMinimise={() => setShowChart(false)}
                  />
                ) : (
                  <CollapsedBar
                    label="Current time series"
                    width={170}
                    onExpand={() => setShowChart(true)}
                  />
                )}
              </g>

              {showAmmeter ? (
                <>
                  <g transform={`translate(60 ${ammY}) scale(0.9)`}>
                    <Ammeter
                      mode={mode}
                      ac={ac}
                      value={sig.value}
                      onMinimise={() => setShowAmmeter(false)}
                    />
                  </g>

                  <text
                    x="150"
                    y={ammY + 169}
                    fontSize="14"
                    textAnchor="middle"
                    fill={C.ink}
                  >
                    Ammeter
                  </text>
                </>
              ) : (
                <g transform={`translate(10 ${ammY})`}>
                  <CollapsedBar
                    label="Ammeter"
                    width={170}
                    onExpand={() => setShowAmmeter(true)}
                  />
                </g>
              )}

              <g transform="translate(382 20) scale(1.75)">
                <Panel
                  {...s}
                  flowDir={sig.flowDir}
                  ac={ac}
                  interactive={waitingForReset}
                  onReset={handleReset}
                />
              </g>
            </svg>

            {guide && (
              <div className="stepPop" role="dialog" aria-live="polite">
                <div className="stepPopHead">
                  <span className="stepCount">
                    Step {guide.index + 1} of {guide.steps.length}
                  </span>
                  {frozen && <span className="stepFrozen">Time paused</span>}
                </div>
                <h3>{guide.steps[guide.index].title}</h3>
                <p>{guide.steps[guide.index].body}</p>
                <div className="stepPopFoot">
                  {inSurgeFinalStep ? (
                    <>
                      <button
                        className="stepLower"
                        onClick={handleReset}
                        disabled={animating || !tripped}
                      >
                        {animating
                          ? "Lowering…"
                          : tripped
                          ? "Lower the plunger"
                          : "Plunger lowered"}
                      </button>
                      <button className="stepNext" onClick={endGuide}>
                        Finish
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="stepSkip" onClick={endGuide}>
                        Skip to end
                      </button>
                      <button className="stepNext" onClick={nextStep}>
                        {guide.index + 1 === guide.steps.length ? "Finish" : "Next"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="controls">
            <div className="controlGroup">
              <button
                className="actionBtn"
                onClick={handleSurge}
                disabled={animating || tripped || !!guide}
              >
                {stepMode ? "Walk through a surge" : "Cause a current surge"}
              </button>

              <button
                className={"stepToggle " + (stepMode ? "on" : "")}
                onClick={() => setStepMode((v) => !v)}
                aria-pressed={stepMode}
                disabled={!!guide}
              >
                <span className="stepToggleTrack">
                  <span className="stepToggleKnob" />
                </span>
                Step-by-step
              </button>
            </div>

            <div className="status">
              <span className={"dot " + (s.current ? "on" : "")} />
              {guide
                ? "Stepping through • time is paused on each moment"
                : s.current
                ? "Circuit closed • current flowing to the house"
                : waitingForReset
                ? "Breaker tripped • click or drag the pulsing reset button down"
                : "Circuit open • breaker tripped"}
            </div>
          </div>
        </section>

        <section className="lesson">
          <div className="lessonBox">
            <h2>1. The electromagnet</h2>
            <p>
              {tripped ? (
                <>
                  The contacts are open, so no current flows and the
                  electromagnet is <span className="offText">off</span>. The
                  bolt's spring pushes it back against the plunger.
                </>
              ) : s.surge ? (
                <>
                  The surge makes the electromagnet{" "}
                  <span className="onText">much stronger</span>, and it
                  attracts the iron bolt.
                </>
              ) : (
                <>
                  Normal current is too small for the electromagnet to
                  overcome the spring holding the bolt in the catch.
                </>
              )}
            </p>
          </div>

          <div className="lessonBox">
            <h2>2. The plunger and switch</h2>
            <p>
              {tripped ? (
                <>
                  With the bolt out of the catch, the spring pushes the
                  plunger up and the switch is{" "}
                  <span className="offText">open</span>. Push the reset
                  button down (click it or drag it) to close the circuit
                  again.
                </>
              ) : (
                <>
                  The bolt holds the plunger down against its spring, keeping
                  the switch <span className="onText">closed</span>.
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
  @keyframes cbDash {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -24; }
  }

  /* Rusty red current animation (also overrides solenoid.jsx's blue) */
  .cb-flow,
  .solenoid-current-flow {
    stroke: #b7410e !important;
  }

  .cb-flow {
    stroke-dasharray: 5 7;
    stroke-dashoffset: 0;
    animation: cbDash 1.2s linear infinite;
  }

  @keyframes cbPulse {
    0% { opacity: .95; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.9, 2.4); }
  }

  @keyframes cbCapFlash {
    0%, 100% { fill: #aeb4bb; }
    50% { fill: #f5a524; }
  }

  .cb-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: cbPulse 1.1s ease-out infinite;
    pointer-events: none;
  }

  .cb-capflash {
    animation: cbCapFlash 1.1s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .cb-flow { animation: none; }
    .cb-pulse { animation: none; opacity: .9; }
    .cb-capflash { animation: none; fill: #f5a524; }
  }
`;